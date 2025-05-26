import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { PenLine, Trash2, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateActivity, deleteActivity, ActivityData } from "@/lib/api";

interface NoteItemProps {
  note: {
    id: string;
    timestamp: string;
    summary: string;
    details: {
      id: number;
      title?: string;
      description?: string;
      created_at: string;
      contact_id: number;
    };
  };
  contactId: string | number;
}

export function NoteItem({ note, contactId }: NoteItemProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [title, setTitle] = useState(note.details.title || "");
  const [description, setDescription] = useState(note.details.description || "");

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Extract the numeric ID from the note ID (e.g., "note-123" -> 123)
  const getNoteId = () => {
    return note.details.id;
  };

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string }) =>
      updateActivity(getNoteId(), data),
    onSuccess: () => {
      // Exit edit mode
      setIsEditing(false);
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["contactActivities", contactId] });
      
      // Show success toast
      toast.success("Note updated successfully");
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast.error(
        error instanceof Error
          ? `Failed to update note: ${error.message}`
          : "Failed to update note"
      );
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteActivity(getNoteId()),
    onSuccess: () => {
      // Close delete dialog
      setIsDeleteDialogOpen(false);
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["contactActivities", contactId] });
      
      // Show success toast
      toast.success("Note deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast.error(
        error instanceof Error
          ? `Failed to delete note: ${error.message}`
          : "Failed to delete note"
      );
    },
  });

  // Handle saving the edited note
  const handleSave = () => {
    updateMutation.mutate({
      title,
      description,
    });
  };

  // Handle cancelling the edit
  const handleCancel = () => {
    // Reset form values to original
    setTitle(note.details.title || "");
    setDescription(note.details.description || "");
    setIsEditing(false);
  };

  // Handle deleting the note
  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Card key={note.id} className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {!isEditing ? (
              <>
                {note.summary}
                <Badge variant="outline" className="ml-2">
                  Note
                </Badge>
              </>
            ) : (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="max-w-md"
              />
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  <PenLine className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this note. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  <span className="sr-only">Save</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>{formatTimestamp(note.timestamp)}</CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div>
            <p>{note.details.description || "No content provided"}</p>
          </div>
        ) : (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Note content"
            rows={4}
          />
        )}
      </CardContent>
    </Card>
  );
} 