import React, { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, List, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Calendar: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  // Mock events for demo
  const events = [
    {
      id: 1,
      title: 'Client Meeting: Sarah Johnson',
      date: new Date(),
      time: '10:00 AM',
      type: 'meeting',
      completed: false,
    },
    {
      id: 2,
      title: 'Follow up with Robert Thompson',
      date: new Date(),
      time: '2:00 PM',
      type: 'call',
      completed: false,
    },
    {
      id: 3,
      title: 'Review underwriting for Williams policy',
      date: new Date(),
      time: '4:00 PM',
      type: 'task',
      completed: false,
    },
    {
      id: 4,
      title: 'Submit policy documents',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      time: '11:30 AM',
      type: 'task',
      completed: false,
    }
  ];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <CalendarDays className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'task':
        return <List className="h-4 w-4 text-amber-500" />;
      default:
        return <List className="h-4 w-4" />;
    }
  };

  const getAllEvents = () => {
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar & Activities</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your schedule and track activities</p>
          </div>
          <div className="flex gap-2">
            <Tabs defaultValue={view} onValueChange={(value) => setView(value as 'calendar' | 'list')}>
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full max-w-none"
                classNames={{
                  day_today: "bg-primary/10 font-bold text-primary",
                  table: "w-full border-collapse",
                  cell: "p-0",
                  head_cell: "text-muted-foreground rounded-md w-10 font-medium text-xs",
                  day: "h-10 w-10 p-0 font-normal text-sm aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {date && getEventsForDate(date).length > 0 ? (
                <div className="space-y-4">
                  {getEventsForDate(date).map(event => (
                    <div key={event.id} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="mr-3 pt-1">
                        <Checkbox id={`event-${event.id}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          <span className="text-sm font-medium">{event.title}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  {date ? 'No events scheduled for this day' : 'Select a date to view events'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAllEvents().map(event => (
                <div key={event.id} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="mr-3 pt-1">
                    <Checkbox id={`list-event-${event.id}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.type)}
                        <span className="text-sm font-medium">{event.title}</span>
                      </div>
                      <Badge variant="outline">
                        {format(event.date, 'MMM d')} at {event.time}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
