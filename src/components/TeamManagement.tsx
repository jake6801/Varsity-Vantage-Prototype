import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Users } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  athleteIds: string[];
}

interface Athlete {
  id: string;
  name: string;
  email: string;
}

interface TeamManagementProps {
  accessToken: string;
  teams: Team[];
  onClose: () => void;
  onTeamsUpdated: () => void;
}

export function TeamManagement({ accessToken, teams, onClose, onTeamsUpdated }: TeamManagementProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teamName, setTeamName] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchAthletes();
    // Get the first team or prepare for creating one
    if (teams.length > 0) {
      setTeam(teams[0]);
      setTeamName(teams[0].name);
      setSelectedAthletes(teams[0].athleteIds || []);
    }
  }, [teams]);

  const fetchAthletes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/athletes`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setAthletes(result.athletes || []);
      } else {
        console.log('Failed to fetch athletes:', result.error);
      }
    } catch (err) {
      console.log('Error fetching athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    try {
      if (team) {
        // Update existing team
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/teams/${team.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: teamName,
              athleteIds: selectedAthletes,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          onTeamsUpdated();
          onClose();
        } else {
          console.log('Failed to update team:', result.error);
          alert('Failed to update team: ' + result.error);
        }
      } else {
        // Create new team
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/teams`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: teamName,
              athleteIds: selectedAthletes,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          onTeamsUpdated();
          onClose();
        } else {
          console.log('Failed to create team:', result.error);
          alert('Failed to create team: ' + result.error);
        }
      }
    } catch (err) {
      console.log('Error saving team:', err);
      alert('Error saving team');
    }
  };

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team ? 'Edit Team Roster' : 'Create Team'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Varsity Team"
                />
              </div>

              <div className="space-y-2">
                <Label>Team Roster</Label>
                <p className="text-sm text-gray-600">
                  Select athletes to add to your team ({selectedAthletes.length} selected)
                </p>
                {athletes.length === 0 ? (
                  <div className="text-sm text-gray-500 py-8 text-center border rounded-lg">
                    No athletes available. Athletes need to sign up first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-auto border rounded-lg p-4">
                    {athletes.map(athlete => (
                      <div 
                        key={athlete.id} 
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          id={athlete.id}
                          checked={selectedAthletes.includes(athlete.id)}
                          onCheckedChange={() => toggleAthlete(athlete.id)}
                        />
                        <Label
                          htmlFor={athlete.id}
                          className="cursor-pointer flex-1"
                        >
                          <div>{athlete.name}</div>
                          <div className="text-sm text-gray-500">{athlete.email}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {team ? 'Save Changes' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}