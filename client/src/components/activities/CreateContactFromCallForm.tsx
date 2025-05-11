import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContactManually, linkCallToContact, type CallLogEntry, type NewContactData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

interface CreateContactFromCallFormProps {
  call: CallLogEntry;
  onContactCreatedAndLinked: () => void;
  setOpen?: (open: boolean) => void;
}

export function CreateContactFromCallForm({
  call,
  onContactCreatedAndLinked,
  setOpen,
}: CreateContactFromCallFormProps) {
  // Form state
  const [formData, setFormData] = useState<NewContactData>({
    first_name: '',
    last_name: '',
    phone: call.from_number,
    email: '',
    company: '',
  });

  const queryClient = useQueryClient();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mutation for creating a contact
  const createContactMutation = useMutation({
    mutationFn: createContactManually,
    onSuccess: (newContact) => {
      console.log('Contact created successfully:', newContact);
      // Get the appropriate ID, handling both possible API response formats
      const contactId = typeof newContact.id !== 'undefined' 
        ? newContact.id 
        : (newContact as any).contact_id 
          ? parseInt((newContact as any).contact_id, 10) 
          : null;
      
      if (!contactId) {
        console.error('Could not determine contact ID from response:', newContact);
        alert('Contact was created but no ID was returned. Please try linking manually.');
        return;
      }
      
      // Trigger the second mutation to link the call to the newly created contact
      linkCallMutation.mutate({ callId: call.id, contactId });
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
      // Show a more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create contact: ${errorMessage}\n\nPlease check with your administrator if the contacts API is properly configured.`);
    },
  });

  // Mutation for linking a call to a contact
  const linkCallMutation = useMutation({
    mutationFn: ({ callId, contactId }: { callId: number, contactId: number }) => {
      return linkCallToContact(callId, contactId);
    },
    onSuccess: () => {
      console.log('Call linked to contact successfully');
      // Invalidate the callLogs query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['callLogs'] });
      
      alert('Contact created and linked to call successfully.');
      
      // Call the callback
      onContactCreatedAndLinked();
      
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
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    createContactMutation.mutate(formData);
  };

  const isLoading = createContactMutation.isPending || linkCallMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="First Name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Last Name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (from call)</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
          readOnly
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company (optional)</Label>
        <Input
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Company Name"
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen && setOpen(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create & Link Contact'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default CreateContactFromCallForm; 