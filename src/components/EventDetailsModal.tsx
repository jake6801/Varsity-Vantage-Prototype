import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Trash2, Edit2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
}

interface AttendanceRecord {
  userId: string;
  name: string;
  email: string;
  status: string;
}

interface EventDetailsModalProps {
  event: Event;
  accessToken: string;
  onClose: () => void;
  onUpdate: (eventId: string, updates: any) => void;
  onDelete: (eventId: string) => void;
  teams: Team[];
}

export function EventDetailsModal({ event, accessToken, onClose, onUpdate, onDelete, teams }: EventDetailsModalProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);

  useEffect(() => {
    setEditedEvent(event);
    fetchAttendance();
  }, [event]);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/attendance/${event.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setAttendance(result.attendance || []);
      } else {
        console.log('Failed to fetch attendance:', result.error);
      }
    } catch (err) {
      console.log('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onUpdate(event.id, {
      name: editedEvent.name,
      type: editedEvent.type,
      date: editedEvent.date,
      time: editedEvent.time,
      location: editedEvent.location,
      teamId: editedEvent.teamId,
    });
    setEditMode(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'here') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (status === 'absent') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <HelpCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'here') {
      return <Badge className="bg-green-100 text-green-800">Present</Badge>;
    } else if (status === 'absent') {
      return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const attendanceStats = {
    here: attendance.filter(a => a.status === 'here').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    unknown: attendance.filter(a => a.status === 'unknown').length,
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {editMode ? (
              <Input
                value={editedEvent.name}
                onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
                className="text-xl"
              />
            ) : (
              event.name
            )}
            {!editMode && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(event.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            {editMode ? (
              <>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={editedEvent.type}
                    onValueChange={(value) => setEditedEvent({ ...editedEvent, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editedEvent.date}
                      onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={editedEvent.time}
                      onChange={(e) => setEditedEvent({ ...editedEvent, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editedEvent.location}
                    onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={editedEvent.teamId || undefined}
                    onValueChange={(value) => setEditedEvent({ ...editedEvent, teamId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All athletes" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge>{event.type}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{event.time}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="border-t pt-4">
            <h3 className="mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl text-green-600">{attendanceStats.here}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl text-red-600">{attendanceStats.absent}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl text-gray-600">{attendanceStats.unknown}</div>
                <div className="text-sm text-gray-600">Unknown</div>
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="border-t pt-4">
            <h3 className="mb-3">Athlete Attendance</h3>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading attendance...</div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No athletes found</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {attendance.map(record => (
                  <div
                    key={record.userId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <div>{record.name}</div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}