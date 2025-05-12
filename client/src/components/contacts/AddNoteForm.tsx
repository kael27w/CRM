import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNoteActivity } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

interface AddNoteFormProps {
  contactId: string | number;
  onNoteAdded: () => void;
  setOpen?: (open: boolean) => void;
}

export function AddNoteForm({ contactId, onNoteAdded, setOpen }: AddNoteFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createNoteMutation = useMutation({
    mutationFn: createNoteActivity,
    onSuccess: (data) => {
      console.log("Note created successfully:", data);
      // Invalidate the contact activities query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ["contactActivities", contactId],
      });
      toast({
        title: "Note added",
        description: "The note has been added successfully",
        variant: "default",
      });
      // Clear the form
      setTitle("");
      setDescription("");
      // Call the callback
      onNoteAdded();
      // Close the dialog if setOpen is provided
      if (setOpen) setOpen(false);
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Add Note form submission triggered!");
    
    if (!description.trim()) {
      toast({
        title: "Validation Error",
        description: "Note content is required",
        variant: "destructive",
      });
      return;
    }

    console.log("Form data for new note:", { title, description });
    setIsSubmitting(true);
    
    createNoteMutation.mutate({
      contact_id: Number(contactId),
      type: 'note',
      title: title.trim() || undefined, // If title is empty, make it undefined
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title (Optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Note Content</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter your note here..."
          rows={5}
          required
          disabled={isSubmitting}
          className="min-h-[100px]"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Note"}
      </Button>
    </form>
  );
} 