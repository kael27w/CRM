import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { updateEvent, fetchContacts, fetchCompanies, type EventUpdateData, type ActivityEntry, type ContactEntry, type Company } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { cn } from '../../lib/utils';

// Validation schema (same as AddEventDialog)
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  start_time: z.string().min(1, 'Start time is required'),
  end_date: z.date().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  contact_id: z.number().optional(),
  company_id: z.number().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).default('pending'),
}).refine((data) => {
  // If end_date and end_time are provided, ensure end is after start
  if (data.end_date && data.end_time) {
    const startDateTime = new Date(data.start_date);
    const [startHours, startMinutes] = data.start_time.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(data.end_date);
    const [endHours, endMinutes] = data.end_time.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    
    return endDateTime > startDateTime;
  }
  return true;
}, {
  message: 'End date/time must be after start date/time',
  path: ['end_time'],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ActivityEntry;
}

export function EditEventDialog({ open, onOpenChange, event }: EditEventDialogProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: new Date(),
      start_time: '09:00',
      end_date: undefined,
      end_time: '',
      location: '',
      contact_id: undefined,
      company_id: undefined,
      status: 'pending',
    },
  });

  // Populate form when event changes
  useEffect(() => {
    if (event && open) {
      console.log('Populating form with event data:', event);
      
      // Parse start_datetime
      let startDate = new Date();
      let startTime = '09:00';
      if (event.start_datetime) {
        const startDateTime = new Date(event.start_datetime);
        startDate = startDateTime;
        startTime = startDateTime.toTimeString().slice(0, 5); // HH:MM format
      }
      
      // Parse end_datetime
      let endDate: Date | undefined;
      let endTime = '';
      if (event.end_datetime) {
        const endDateTime = new Date(event.end_datetime);
        endDate = endDateTime;
        endTime = endDateTime.toTimeString().slice(0, 5); // HH:MM format
      }
      
      form.reset({
        title: event.title || '',
        description: event.description || '',
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location: event.location || '',
        contact_id: event.contact_id || undefined,
        company_id: event.company_id || undefined,
        status: (event.status as any) || 'pending',
      });
    }
  }, [event, open, form]);

  // Fetch contacts for dropdown
  const { data: contacts = [] } = useQuery<ContactEntry[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, updateData }: { eventId: number; updateData: EventUpdateData }) => 
      updateEvent(eventId, updateData),
    onSuccess: (data) => {
      console.log('Event updated successfully:', data);
      toast.success('Event updated successfully!');
      
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error updating event:', error);
      toast.error(`Error updating event: ${error.message}`);
    },
  });

  const onSubmit = (data: EventFormData) => {
    console.log('Form submitted with data:', data);
    
    // Combine date and time for start_datetime
    const startDateTime = new Date(data.start_date);
    const [startHours, startMinutes] = data.start_time.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    // Combine date and time for end_datetime if provided
    let endDateTime: Date | undefined;
    if (data.end_date && data.end_time) {
      endDateTime = new Date(data.end_date);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }
    
    const updateData: EventUpdateData = {
      title: data.title,
      description: data.description || undefined,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime?.toISOString(),
      location: data.location || undefined,
      contact_id: data.contact_id || undefined,
      company_id: data.company_id || undefined,
      status: data.status,
    };
    
    console.log('Submitting event update data:', updateData);
    updateEventMutation.mutate({ eventId: event.id, updateData });
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the event details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Event description (optional)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick end date (optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Event location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact and Company */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Contact</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No contact</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.first_name} {contact.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Company</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No company</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateEventMutation.isPending}
              >
                {updateEventMutation.isPending ? 'Updating...' : 'Update Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 