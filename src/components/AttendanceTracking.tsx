import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Search, UserCheck } from 'lucide-react';

interface AttendanceRecord {
  userId: string;
  name: string;
  email: string;
  status: string;
  eventId: string;
}

interface AthleteStats {
  userId: string;
  name: string;
  email: string;
  totalEvents: number;
  present: number;
  absent: number;
  unknown: number;
  attendanceRate: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
}

interface AttendanceTrackingProps {
  accessToken: string;
}

export function AttendanceTracking({ accessToken }: AttendanceTrackingProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [athleteStats, setAthleteStats] = useState<AthleteStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<AthleteStats[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [allAttendance, events, selectedEvent]);

  useEffect(() => {
    filterStats();
  }, [athleteStats, searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      // Fetch events
      const eventsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const eventsResult = await eventsResponse.json();
      if (eventsResponse.ok) {
        setEvents(eventsResult.events || []);
      }

      // Fetch all attendance records
      const attendanceResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-156de6d6/attendance/all`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const attendanceResult = await attendanceResponse.json();
      if (attendanceResponse.ok) {
        setAllAttendance(attendanceResult.attendance || []);
      }
    } catch (err) {
      console.log('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Group attendance by athlete
    const athleteMap = new Map<string, AthleteStats>();

    // Filter events based on selection
    const relevantEvents = selectedEvent === 'all' 
      ? events 
      : events.filter(e => e.id === selectedEvent);

    // Get all unique athletes from attendance records
    allAttendance.forEach(record => {
      if (!athleteMap.has(record.userId)) {
        athleteMap.set(record.userId, {
          userId: record.userId,
          name: record.name,
          email: record.email,
          totalEvents: 0,
          present: 0,
          absent: 0,
          unknown: 0,
          attendanceRate: 0,
        });
      }
    });

    // Calculate stats for each athlete
    athleteMap.forEach((stats, userId) => {
      const athleteRecords = allAttendance.filter(r => 
        r.userId === userId && 
        (selectedEvent === 'all' || r.eventId === selectedEvent)
      );

      stats.totalEvents = selectedEvent === 'all' 
        ? relevantEvents.length 
        : 1;
      
      stats.present = athleteRecords.filter(r => r.status === 'here').length;
      stats.absent = athleteRecords.filter(r => r.status === 'absent').length;
      stats.unknown = stats.totalEvents - stats.present - stats.absent;
      stats.attendanceRate = stats.totalEvents > 0 
        ? (stats.present / stats.totalEvents) * 100 
        : 0;
    });

    const statsArray = Array.from(athleteMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    setAthleteStats(statsArray);
  };

  const filterStats = () => {
    let filtered = [...athleteStats];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(stat =>
        stat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stat.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(stat => {
        if (statusFilter === 'present') return stat.present > 0;
        if (statusFilter === 'absent') return stat.absent > 0;
        if (statusFilter === 'unknown') return stat.unknown > 0;
        return true;
      });
    }

    setFilteredStats(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Athlete', 'Email', 'Total Events', 'Present', 'Absent', 'Unknown', 'Attendance Rate'];
    const rows = filteredStats.map(stat => [
      stat.name,
      stat.email,
      stat.totalEvents,
      stat.present,
      stat.absent,
      stat.unknown,
      `${stat.attendanceRate.toFixed(1)}%`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-xl">
          <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
          Attendance Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="space-y-1 md:space-y-2">
            <label className="text-xs md:text-sm text-gray-600">Event</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date + 'T00:00:00').toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-2">
            <label className="text-xs md:text-sm text-gray-600">Search Athletes</label>
            <div className="relative">
              <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 md:pl-9 text-xs md:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            <label className="text-xs md:text-sm text-gray-600">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-2">
            <label className="text-xs md:text-sm text-gray-600">Export</label>
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              size="sm"
              className="w-full text-xs md:text-sm"
              disabled={filteredStats.length === 0}
            >
              <Download className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Export CSV</span>
              <span className="md:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading attendance data...</div>
        ) : filteredStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No athletes found</div>
        ) : (
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm text-gray-600">Athlete</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm text-gray-600">Total</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm text-gray-600">
                        <span className="hidden md:inline">Present</span>
                        <span className="md:hidden">✓</span>
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm text-gray-600">
                        <span className="hidden md:inline">Absent</span>
                        <span className="md:hidden">✗</span>
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm text-gray-600">
                        <span className="hidden md:inline">Unknown</span>
                        <span className="md:hidden">?</span>
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm text-gray-600">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {filteredStats.map(stat => (
                      <tr key={stat.userId} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <div>
                            <div className="text-xs md:text-sm">{stat.name}</div>
                            <div className="text-xs text-gray-500 hidden md:block">{stat.email}</div>
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm">{stat.totalEvents}</td>
                        <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 text-green-800 text-xs md:text-sm">
                            {stat.present}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-100 text-red-800 text-xs md:text-sm">
                            {stat.absent}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm">
                            {stat.unknown}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                              stat.attendanceRate >= 80 ? 'bg-green-500' :
                              stat.attendanceRate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-xs md:text-sm">{stat.attendanceRate.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}