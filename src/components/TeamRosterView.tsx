import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Users, Mail, UserPlus, Pencil } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  athleteIds: string[];
}

interface TeamRosterViewProps {
  accessToken: string;
  onManageTeam: () => void;
}

export function TeamRosterView({ accessToken, onManageTeam }: TeamRosterViewProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all athletes
      const athletesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/athletes`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const athletesResult = await athletesResponse.json();
      if (athletesResponse.ok) {
        setAthletes(athletesResult.athletes || []);
      }

      // Fetch team
      const teamsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/teams`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const teamsResult = await teamsResponse.json();
      if (teamsResponse.ok && teamsResult.teams && teamsResult.teams.length > 0) {
        setTeam(teamsResult.teams[0]);
      }
    } catch (err) {
      console.log('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const rosterAthletes = team 
    ? athletes.filter(a => team.athleteIds.includes(a.id))
    : athletes;

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-xl flex-1 min-w-0">
            <Users className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="truncate">Team Roster</span>
            {team && <Badge variant="secondary" className="text-xs">{team.name}</Badge>}
          </CardTitle>
          <Button onClick={onManageTeam} variant="outline" size="sm" className="flex-shrink-0">
            <Pencil className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="hidden md:inline">Edit Roster</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading roster...</div>
        ) : rosterAthletes.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-500 mb-3 md:mb-4">No athletes in the roster yet</p>
            <Button onClick={onManageTeam} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Athletes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {rosterAthletes.map(athlete => (
                <Card key={athlete.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs md:text-sm">
                          {getInitials(athlete.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-base truncate">{athlete.name}</h4>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 mt-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{athlete.email}</span>
                        </div>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Athlete
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 md:pt-6 border-t">
              <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
                <span>Total Athletes: {rosterAthletes.length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}