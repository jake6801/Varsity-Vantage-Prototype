import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Team {
  id: string;
  name: string;
}

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: any) => void;
  teams: Team[];
}

export function CreateEventModal({ open, onClose, onCreateEvent, teams }: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('practice');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [teamId, setTeamId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !date || !time) {
      alert('Please fill in all required fields');
      return;
    }

    onCreateEvent({
      name,
      type,
      date,
      time,
      location,
      teamId: teamId || null,
    });

    // Reset form
    setName('');
    setType('practice');
    setDate('');
    setTime('');
    setLocation('');
    setTeamId('');
  };

  const handleClose = () => {
    setName('');
    setType('practice');
    setDate('');
    setTime('');
    setLocation('');
    setTeamId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Practice Session"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <Select value={type} onValueChange={setType}>
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
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Main Gym"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team (Optional)</Label>
              <Select value={teamId || undefined} onValueChange={setTeamId}>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}