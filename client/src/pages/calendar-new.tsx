import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Plus, 
  Clock, 
  CalendarDays, 
  Users,
  Check,
  Phone
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

// Event type definition
interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  type: 'meeting' | 'call' | 'task';
  completed: boolean;
}

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Mock events for demo
  const events: CalendarEvent[] = [
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
    // Add events for tomorrow
    {
      id: 4,
      title: 'Team Status Meeting',
      date: addDays(new Date(), 1),
      time: '9:00 AM',
      type: 'meeting',
      completed: false,
    },
    // Add event for next week
    {
      id: 5,
      title: 'Quarterly Review',
      date: addDays(new Date(), 7),
      time: '11:00 AM',
      type: 'meeting',
      completed: false,
    }
  ];

  // Helper to get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-3.5 w-3.5 text-blue-500" />;
      case 'call':
        return <Phone className="h-3.5 w-3.5 text-green-500" />;
      case 'task':
        return <Check className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-slate-300"></div>;
    }
  };

  // Filter events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => 
      isSameDay(event.date, date)
    );
  };

  // Get all events sorted by date and time
  const getAllEvents = () => {
    return events.sort((a, b) => 
      a.date.getTime() === b.date.getTime() 
        ? a.time.localeCompare(b.time) 
        : a.date.getTime() - b.date.getTime()
    );
  };

  // Get event count for a specific date
  const getEventCountForDate = (date: Date) => {
    return getEventsForDate(date).length;
  };

  // Create calendar days for current month view
  const renderCalendarCells = () => {
    // Get all dates for the current month view (including some days from previous/next month to fill the grid)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = [];
    const rows = [];
    
    // Create header row with day names
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const dayHeaders = daysOfWeek.map((day, i) => (
      <div key={`header-${i}`} className="text-center font-medium text-sm py-2">
        {day}
      </div>
    ));
    rows.push(<div key="header" className="grid grid-cols-7 gap-1">{dayHeaders}</div>);

    // Create all date cells
    let dates = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    // Split dates into rows, 7 days each
    let days_in_month = [];
    for (let i = 0; i < dates.length; i += 7) {
      days_in_month.push(dates.slice(i, i + 7));
    }

    return (
      <div className="space-y-1">
        {rows}
        {days_in_month.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIdx) => {
              const eventCount = getEventCountForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isDayToday = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div
                  key={`day-${dayIdx}`}
                  className={`
                    min-h-[80px] p-1 rounded-md border
                    ${isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600'}
                    ${isSelected ? 'border-blue-500 dark:border-blue-600 shadow-sm' : 'border-slate-200 dark:border-slate-700'}
                    ${isDayToday ? 'font-bold' : 'font-normal'}
                    cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex flex-col h-full">
                    <div className={`
                      text-right p-1 relative
                      ${isDayToday ? 'text-blue-600 dark:text-blue-400' : ''}
                    `}>
                      <span className={`
                        ${isDayToday ? 'bg-blue-100/80 dark:bg-blue-900/50 w-6 h-6 rounded-full flex items-center justify-center' : ''}
                        ${isDayToday ? 'ml-auto' : ''}
                      `}>
                        {format(day, dateFormat)}
                      </span>
                    </div>
                    
                    {/* Event indicators */}
                    {eventCount > 0 && isCurrentMonth && (
                      <div className="mt-auto">
                        {eventCount === 1 && (
                          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs p-0.5 px-1.5 rounded-sm truncate mt-1">
                            {getEventsForDate(day)[0].title.substring(0, 15)}
                            {getEventsForDate(day)[0].title.length > 15 ? '...' : ''}
                          </div>
                        )}
                        {eventCount > 1 && (
                          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs p-0.5 px-1.5 rounded-sm mt-1">
                            {eventCount} events
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar & Activities</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your schedule and track activities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex bg-white dark:bg-slate-800 rounded-md border p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Full width calendar view */}
          <Card className="lg:col-span-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(previousMonth => new Date(previousMonth.getFullYear(), previousMonth.getMonth() - 1, 1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                      setSelectedDate(today);
                    }}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(previousMonth => new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {renderCalendarCells()}
            </CardContent>
          </Card>
          
          {/* Selected day details */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map(event => (
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
                <div className="text-center py-8 px-4">
                  <CalendarDays className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-slate-500 dark:text-slate-400">No events scheduled for this day</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Event
                  </Button>
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