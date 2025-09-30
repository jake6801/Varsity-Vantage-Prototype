import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronLeft, ChevronRight, LogOut, Plus, Calendar as CalendarIcon, UserCheck, Users } from 'lucide-react';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { TeamManagement } from './TeamManagement';
import { AttendanceTracking } from './AttendanceTracking';
import { TeamRosterView } from './TeamRosterView';

interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  teamId?: string;
}

interface Team {
  id: string;
  name: string;
  athleteIds: string[];
}

interface CoachViewProps {
  accessToken: string;
  onLogout: () => void;
}

export function CoachView({ accessToken, onLogout }: CoachViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    fetchEvents();
    fetchTeams();
  }, []);

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

  const fetchTeams = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/teams`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setTeams(result.teams || []);
      } else {
        console.log('Failed to fetch teams:', result.error);
      }
    } catch (err) {
      console.log('Error fetching teams:', err);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(eventData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEvents([...events, result.event]);
        setShowCreateEvent(false);
      } else {
        console.log('Failed to create event:', result.error);
        alert('Failed to create event: ' + result.error);
      }
    } catch (err) {
      console.log('Error creating event:', err);
      alert('Error creating event');
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEvents(events.map(e => e.id === eventId ? result.event : e));
        setSelectedEvent(result.event);
      } else {
        console.log('Failed to update event:', result.error);
        alert('Failed to update event: ' + result.error);
      }
    } catch (err) {
      console.log('Error updating event:', err);
      alert('Error updating event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
        setSelectedEvent(null);
      } else {
        console.log('Failed to delete event:', result.error);
        alert('Failed to delete event: ' + result.error);
      }
    } catch (err) {
      console.log('Error deleting event:', err);
      alert('Error deleting event');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-2xl">Coach Dashboard</h1>
          <div className="flex gap-2">
            {activeTab === 'calendar' && (
              <Button size="sm" onClick={() => setShowCreateEvent(true)} className="hidden md:flex">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">New Event</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6">
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              <CalendarIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs md:text-sm">
              <UserCheck className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-xs md:text-sm">
              <Users className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Roster</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            {/* Mobile New Event Button */}
            <div className="md:hidden">
              <Button onClick={() => setShowCreateEvent(true)} className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base md:text-2xl">{monthName}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading events...</div>
                ) : (
                  <>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs md:text-sm text-gray-600 py-1 md:py-2">
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
                            <div className="text-xs md:text-sm">{day}</div>
                            {dayEvents.length > 0 && (
                              <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1">
                                {dayEvents.slice(0, 2).map(event => (
                                  <div
                                    key={event.id}
                                    className="text-xs bg-blue-600 text-white px-0.5 md:px-1 rounded truncate"
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
                                    +{dayEvents.length - 2}
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
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-xl">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No events scheduled. Create your first event to get started.
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {events
                      .filter(event => new Date(event.date + 'T00:00:00') >= new Date(new Date().toDateString()))
                      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
                      .slice(0, 5)
                      .map(event => (
                        <div
                          key={event.id}
                          className="border rounded-lg p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm md:text-base truncate">{event.name}</span>
                                <Badge variant="secondary" className="text-xs">{event.type}</Badge>
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 mt-1">
                                {new Date(event.date + 'T00:00:00').toLocaleDateString()} at {event.time}
                                {event.location && ` • ${event.location}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              className="hidden md:flex"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTracking accessToken={accessToken} />
          </TabsContent>

          <TabsContent value="roster">
            <TeamRosterView 
              accessToken={accessToken}
              onManageTeam={() => setShowTeamManagement(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateEventModal
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onCreateEvent={handleCreateEvent}
        teams={teams}
      />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          accessToken={accessToken}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          teams={teams}
        />
      )}

      {showTeamManagement && (
        <TeamManagement
          accessToken={accessToken}
          teams={teams}
          onClose={() => setShowTeamManagement(false)}
          onTeamsUpdated={fetchTeams}
        />
      )}
    </div>
  );
}