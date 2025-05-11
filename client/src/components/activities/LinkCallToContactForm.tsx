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
      alert('Failed to link call to contact. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the contact ID
    const contactId = parseInt(contactIdInput.trim(), 10);
    if (isNaN(contactId) || contactId <= 0) {
      alert('Please enter a valid contact ID number.');
      return;
    }
    
    console.log(`Linking call ${call.id} to contact ${contactId}`);
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
          disabled={linkCallMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={linkCallMutation.isPending}>
          {linkCallMutation.isPending ? 'Linking...' : 'Link Contact'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default LinkCallToContactForm; 