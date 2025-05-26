import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContactActivities, UnifiedActivityEntry, fetchContactById, ContactEntry } from "../lib/api";
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
import { PlusCircle, Phone, Mail, Briefcase, PenLine, Clock } from "lucide-react"; // Import additional icons

// Import EditContactDialog directly
import EditContactDialog from "@/components/contacts/EditContactDialog";

// Used for direct component usage
interface ContactDetailPageProps {
  contactId?: string | number;
}

export function ContactDetailPage({ contactId: propContactId }: ContactDetailPageProps) {
  // Get contactId from route params if not provided as prop
  const params = useParams<{ id: string }>();
  const contactId = propContactId || params.id;
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  console.log("ContactDetailPage - contactId from props:", propContactId);
  console.log("ContactDetailPage - contactId from params:", params.id);
  console.log("ContactDetailPage - using contactId:", contactId);

  // Fetch contact details
  const {
    data: contact,
    isLoading: isContactLoading,
    isError: isContactError,
    error: contactError
  } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => fetchContactById(contactId),
    enabled: !!contactId,
  });

  // Fetch contact activities
  const {
    data: activities,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ["contactActivities", contactId],
    queryFn: () => fetchContactActivities(contactId),
    enabled: !!contactId, // Only run the query if contactId is available
  });

  console.log("ContactDetailPage rendering for contactId:", contactId);
  console.log("Contact data:", contact);
  console.log("Activities data:", activities);

  const isLoading = isContactLoading || isActivitiesLoading;
  const isError = isContactError || isActivitiesError;
  const error = contactError || activitiesError;

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
          <h1 className="text-2xl font-bold">Contact Details</h1>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        {/* Contact Info Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Feed Skeleton */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Activity History</h2>
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
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Contact Details</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'Not available';
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return 'Invalid date';
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
        <h1 className="text-2xl font-bold">Contact Details</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAddNoteDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Note
          </Button>
          <Button 
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <PenLine className="h-4 w-4" />
            Edit Contact
          </Button>
        </div>
      </div>
      
      {/* Contact Information Card */}
      {contact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{contact.first_name} {contact.last_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span>{contact.phone || "—"}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span>{contact.email || "—"}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Company:</span>
                  <span>{contact.company || "—"}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(contact.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Activity Feed Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Activity History</h2>
        <div className="space-y-4">
          {!activities || activities.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">No activities found for this contact.</p>
              </CardContent>
            </Card>
          ) : (
            activities.map((activity: UnifiedActivityEntry) => (
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
                  </div>
                  <CardDescription>
                    {formatTimestamp(activity.timestamp)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activity.type === "call" && (
                    <div>
                      <p>Direction: {activity.details.direction}</p>
                      <p>Duration: {formatDuration(activity.details.duration)}</p>
                      <p>Status: {activity.details.status}</p>
                    </div>
                  )}
                  {activity.type === "task" && (
                    <div>
                      <p>{activity.details.description || "No description provided"}</p>
                      {activity.details.due_date && (
                        <p className="text-sm text-gray-500 mt-2">
                          Due: {formatTimestamp(activity.details.due_date)}
                        </p>
                      )}
                    </div>
                  )}
                  {activity.type === "note" && (
                    <div>
                      <p>{activity.details.description || "No content provided"}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Add Note Dialog */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Note</DialogTitle>
          </DialogHeader>
          <AddNoteForm
            contactId={contactId}
            onNoteAdded={() => refetchActivities()}
            setOpen={setIsAddNoteDialogOpen}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Contact Dialog */}
      {contact && (
        <EditContactDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          contact={contact}
        />
      )}
    </div>
  );
}

export default ContactDetailPage; 