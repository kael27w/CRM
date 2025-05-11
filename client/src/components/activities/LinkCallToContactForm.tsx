import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linkCallToContact, type CallLogEntry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

interface LinkCallToContactFormProps {
  call: CallLogEntry;
  onCallLinked: () => void;
  setOpen?: (open: boolean) => void;
}

export function LinkCallToContactForm({
  call,
  onCallLinked,
  setOpen,
}: LinkCallToContactFormProps) {
  const [contactIdInput, setContactIdInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Mutation for linking a call to a contact
  const linkCallMutation = useMutation({
    mutationFn: (contactId: number) => linkCallToContact(call.id, contactId),
    onSuccess: (updatedCall) => {
      console.log('Call linked to contact successfully:', updatedCall);
      
      // Invalidate the callLogs query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['callLogs'] });
      
      alert('Call linked to contact successfully.');
      
      // Call the callback
      onCallLinked();
      
      // Close the dialog if setOpen is provided
      if (setOpen) {
        setOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error linking call to contact:', error);
      // Show a more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to link call to contact: ${errorMessage}\n\nPlease check with your administrator if the API is properly configured.`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the contact ID
    const contactId = parseInt(contactIdInput.trim(), 10);
    if (isNaN(contactId) || contactId <= 0) {
      alert('Please enter a valid contact ID number.');
      return;
    }
    
    setIsSubmitting(true);
    console.log(`Linking call ${call.id} to contact ${contactId}`);

    // Add a direct API check for the contact before attempting to link
    try {
      // This is a simple check to see if we're running locally or not
      const isLocal = window.location.hostname === 'localhost';
      const baseUrl = isLocal ? 'http://localhost:3002' : 'https://crm-2lmw.onrender.com';
      
      const response = await fetch(`${baseUrl}/api/debug/supabase`);
      if (!response.ok) {
        console.warn('Server connection check failed - proceeding anyway:', await response.text());
      } else {
        console.log('Server connection confirmed:', await response.json());
      }
    } catch (error) {
      console.warn('Error checking server connection:', error);
      // Continue anyway as this is just a preflight check
    }
    
    linkCallMutation.mutate(contactId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contactId">Contact ID</Label>
        <Input
          id="contactId"
          value={contactIdInput}
          onChange={(e) => setContactIdInput(e.target.value)}
          placeholder="Enter existing contact ID"
          type="number"
          min="1"
          required
        />
        <p className="text-sm text-slate-500">
          Enter the ID of an existing contact to link with this call.
        </p>
      </div>
      
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen && setOpen(false)}
          disabled={isSubmitting || linkCallMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || linkCallMutation.isPending}>
          {isSubmitting || linkCallMutation.isPending ? 'Linking...' : 'Link Contact'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default LinkCallToContactForm; 