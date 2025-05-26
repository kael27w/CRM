import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createContactManually } from "@/lib/api";

// Contact statuses
const CONTACT_STATUSES = [
  "Lead",
  "Prospect",
  "Active Client",
  "Inactive Client",
] as const;

// Log the available statuses for debugging
console.log('[ADD_CONTACT_DIALOG] Available status options:', CONTACT_STATUSES);

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
  status: z.enum(CONTACT_STATUSES, {
    required_error: "Please select a status",
  }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for adding a new contact
 */
export function AddContactDialog({ open, onOpenChange }: AddContactDialogProps) {
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      company: "",
      status: "Lead",
    },
  });

  // Create contact mutation
  const mutation = useMutation({
    mutationFn: createContactManually,
    onSuccess: () => {
      // Reset form
      form.reset();
      
      // Close dialog
      onOpenChange(false);
      
      // Invalidate contacts list query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["contactsList"] });
      
      // Show success toast
      toast.success("Contact created successfully");
    },
    onError: (error) => {
      console.error("Error creating contact:", error);
      toast.error(
        error instanceof Error 
          ? `Failed to create contact: ${error.message}`
          : "Failed to create contact"
      );
    },
  });

  // Form submission handler
  function onSubmit(data: ContactFormValues) {
    console.log('[ADD_CONTACT_FORM] Form values:', JSON.stringify(data, null, 2));
    console.log(`[ADD_CONTACT_FORM] Status field: "${data.status}", Type: ${typeof data.status}`);
    
    // The data object is already validated by Zod, so we can use it directly
    // Just make a copy to follow best practices
    const contactData = { ...data };
    
    console.log('[ADD_CONTACT_FORM] Data to be sent to API:', JSON.stringify(contactData, null, 2));
    console.log(`[ADD_CONTACT_FORM] Final status value: "${contactData.status}", Type: ${typeof contactData.status}`);
    
    mutation.mutate(contactData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new contact.
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create Contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddContactDialog; 