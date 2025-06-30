
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ContactEntry, ContactFormData, updateContact } from "@/lib/api";

// Form validation schema
const contactFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        // Remove all non-numeric characters and check length
        const digitsOnly = value.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      },
      {
        message: "Phone number must have at least 10 digits",
      }
    ),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactEntry;
}

/**
 * Dialog component for editing an existing contact
 */
export default function EditContactDialog({ 
  open, 
  onOpenChange, 
  contact 
}: EditContactDialogProps) {
  const queryClient = useQueryClient();
  
  // Initialize form with contact data
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone,
      email: contact.email || "",
      company: contact.company || "",
    },
  });

  // Update contact mutation
  const mutation = useMutation({
    mutationFn: (data: ContactFormData) => updateContact(contact.id, data),
    onSuccess: (updatedContact) => {
      // Close dialog
      onOpenChange(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
      queryClient.invalidateQueries({ queryKey: ["contactsList"] });
      
      // Direct update of the cache for immediate UI update
      queryClient.setQueryData(["contact", contact.id], updatedContact);
      
      // Show success toast
      toast.success("Contact updated successfully");
    },
    onError: (error) => {
      console.error("Error updating contact:", error);
      toast.error(
        error instanceof Error 
          ? `Failed to update contact: ${error.message}`
          : "Failed to update contact"
      );
    },
  });

  // Form submission handler
  function onSubmit(data: ContactFormValues) {
    console.log('[EDIT_CONTACT_FORM] Form values:', JSON.stringify(data, null, 2));
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the contact information for {contact.first_name} {contact.last_name}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone*</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 