import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContactActivities, UnifiedActivityEntry } from "../lib/api";
import { format } from "date-fns";
import { useParams } from "wouter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { AddNoteForm } from "../components/contacts/AddNoteForm";
import { PlusCircle } from "lucide-react"; // Import the icon

// Used for direct component usage
interface ContactDetailPageProps {
  contactId?: string | number;
}

export function ContactDetailPage({ contactId: propContactId }: ContactDetailPageProps) {
  // Get contactId from route params if not provided as prop
  const params = useParams<{ id: string }>();
  const contactId = propContactId || params.id;
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);

  console.log("ContactDetailPage - contactId from props:", propContactId);
  console.log("ContactDetailPage - contactId from params:", params.id);
  console.log("ContactDetailPage - using contactId:", contactId);

  const {
    data: activities,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["contactActivities", contactId],
    queryFn: () => fetchContactActivities(contactId),
    enabled: !!contactId, // Only run the query if contactId is available
  });

  console.log("ContactDetailPage rendering for contactId:", contactId);
  console.log("Activities data:", activities);

  if (!contactId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Contact Details</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              No contact ID provided.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activity Feed for Contact {contactId}</h1>
          <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Note</DialogTitle>
              </DialogHeader>
              <AddNoteForm
                contactId={contactId}
                onNoteAdded={() => refetch()}
                setOpen={setIsAddNoteDialogOpen}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-3 w-40" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activity Feed for Contact {contactId}</h1>
          <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Note</DialogTitle>
              </DialogHeader>
              <AddNoteForm
                contactId={contactId}
                onNoteAdded={() => refetch()}
                setOpen={setIsAddNoteDialogOpen}
              />
            </DialogContent>
          </Dialog>
        </div>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Error loading activities: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activity Feed for Contact {contactId}</h1>
          <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Note</DialogTitle>
              </DialogHeader>
              <AddNoteForm
                contactId={contactId}
                onNoteAdded={() => refetch()}
                setOpen={setIsAddNoteDialogOpen}
              />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No activities found for this contact.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return timestamp;
    }
  };

  // Helper function to format duration in seconds to minutes:seconds
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  
  // Helper function to get badge variant based on activity type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'call': return "default";
      case 'task': return "secondary";
      case 'note': return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Feed for Contact {contactId}</h1>
        <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Note</DialogTitle>
            </DialogHeader>
            <AddNoteForm
              contactId={contactId}
              onNoteAdded={() => refetch()}
              setOpen={setIsAddNoteDialogOpen}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity: UnifiedActivityEntry) => (
          <Card key={activity.id} className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {activity.summary}
                  <Badge
                    variant={getBadgeVariant(activity.type)}
                    className="ml-2"
                  >
                    {activity.type === "call" ? "Call" : 
                     activity.type === "task" ? "Task" : "Note"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {formatTimestamp(activity.timestamp)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {activity.type === "call" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {activity.details.status}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(activity.details.duration)}
                  </div>
                  <div>
                    <span className="font-medium">Direction:</span> {activity.details.direction}
                  </div>
                  <div>
                    <span className="font-medium">Number:</span> {activity.details.from_number}
                  </div>
                </div>
              )}
              
              {activity.type === "task" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {activity.details.status}
                  </div>
                  <div>
                    <span className="font-medium">Completed:</span> {activity.details.completed ? "Yes" : "No"}
                  </div>
                  {activity.details.due_date && (
                    <div>
                      <span className="font-medium">Due Date:</span> {format(new Date(activity.details.due_date), "MMM d, yyyy")}
                    </div>
                  )}
                  {activity.details.description && (
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span> {activity.details.description}
                    </div>
                  )}
                </div>
              )}

              {activity.type === "note" && (
                <div className="text-sm">
                  {activity.details.description && (
                    <p className="whitespace-pre-wrap">{activity.details.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 