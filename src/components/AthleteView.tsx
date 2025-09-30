import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, LogOut, CheckCircle2 } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
}

interface AthleteViewProps {
  accessToken: string;
  onLogout: () => void;
}

export function AthleteView({ accessToken, onLogout }: AthleteViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string>('unknown');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendanceStatus(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEvents(result.events || []);
      } else {
        console.log('Failed to fetch events:', result.error);
      }
    } catch (err) {
      console.log('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStatus = async (eventId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/attendance/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.attendance && result.attendance.length > 0) {
        // Find current user's attendance status
        const userAttendance = result.attendance.find((a: any) => 
          a.status && a.status !== 'unknown'
        );
        setAttendanceStatus(userAttendance?.status || 'unknown');
      } else {
        setAttendanceStatus('unknown');
      }
    } catch (err) {
      console.log('Error fetching attendance:', err);
      setAttendanceStatus('unknown');
    }
  };

  const markAttendance = async (status: string) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/attendance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setAttendanceStatus(status);
      } else {
        console.log('Failed to mark attendance:', result.error);
      }
    } catch (err) {
      console.log('Error marking attendance:', err);
    }
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return events.filter(event => event.date === dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getAttendanceStatusText = () => {
    if (attendanceStatus === 'here') return "You're checked in!";
    return "You're not checked in";
  };

  const getAttendanceStatusColor = () => {
    if (attendanceStatus === 'here') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1>My Schedule</h1>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Calendar Navigation */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{monthName}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading events...</div>
            ) : (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = getEventsForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <div
                        key={day}
                        className={`aspect-square border rounded-lg p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => {
                          if (dayEvents.length === 1) {
                            setSelectedEvent(dayEvents[0]);
                          }
                        }}
                      >
                        <div className="text-sm">{day}</div>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className="text-xs bg-blue-600 text-white px-1 rounded truncate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                              >
                                {event.name}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.date + 'T00:00:00') >= new Date(new Date().toDateString()))
                  .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{event.name}</span>
                            <Badge variant="secondary">{event.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.date + 'T00:00:00').toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedEvent.type}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.time}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="mb-3">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${getAttendanceStatusColor()}`}>
                    {getAttendanceStatusText()}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => markAttendance('here')}
                  disabled={attendanceStatus === 'here'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {attendanceStatus === 'here' ? "You're checked in!" : "I'm here"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}