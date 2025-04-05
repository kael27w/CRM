import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

// Define types for the component
export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  date: Date;
  startTime: string;
  endTime: string;
  allDay: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventData: CalendarEvent) => void;
  event?: CalendarEvent;
  defaultDate?: Date;
}

const CalendarEventDialog: React.FC<CalendarEventDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  event,
  defaultDate = new Date(),
}) => {
  // State for form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("event");
  const [status, setStatus] = useState("pending");
  const [date, setDate] = useState<Date>(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [relatedEntityType, setRelatedEntityType] = useState<string>("");
  const [relatedEntityId, setRelatedEntityId] = useState<number | undefined>(undefined);

  // Populate form when editing an existing event
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setType(event.type || "event");
      setStatus(event.status || "pending");
      setDate(event.date || defaultDate);
      setStartTime(event.startTime || "09:00");
      setEndTime(event.endTime || "10:00");
      setAllDay(event.allDay || false);
      setRelatedEntityType(event.relatedEntityType || "");
      setRelatedEntityId(event.relatedEntityId);
    } else {
      // Reset form for new event
      resetForm();
    }
  }, [event, defaultDate, open]);

  // Reset form to default values
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("event");
    setStatus("pending");
    setDate(defaultDate);
    setStartTime("09:00");
    setEndTime("10:00");
    setAllDay(false);
    setRelatedEntityType("");
    setRelatedEntityId(undefined);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: CalendarEvent = {
      title,
      description,
      type,
      status,
      date,
      startTime,
      endTime,
      allDay,
      relatedEntityType,
      relatedEntityId
    };
    
    // If editing, include the ID
    if (event?.id) {
      eventData.id = event.id;
    }
    
    onSave(eventData);
    resetForm();
    onOpenChange(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? "Edit Activity" : "Add New Activity"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            {/* Description */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            
            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Time Selection */}
            {!allDay && (
              <>
                {/* Start Time */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Start Time
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="col-span-2"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                {/* End Time */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    End Time
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="col-span-2"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </>
            )}
            
            {/* All Day Checkbox */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="allDay"
                  checked={allDay}
                  onCheckedChange={(checked) => setAllDay(checked as boolean)}
                />
                <Label htmlFor="allDay">All day event</Label>
              </div>
            </div>
            
            {/* Related To (optional) - future implementation */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relatedTo" className="text-right">
                Related To
              </Label>
              <div className="col-span-3">
                <p className="text-sm text-muted-foreground">
                  Coming soon: Ability to link to contacts, leads, etc.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {event ? "Update" : "Create"} Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventDialog; 