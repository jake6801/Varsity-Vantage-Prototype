import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Sign up new user with role
app.post('/make-server-156de6d6/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (role !== 'athlete' && role !== 'coach') {
      return c.json({ error: 'Invalid role. Must be athlete or coach' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Supabase auth error during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
    });

    return c.json({ success: true, user: { id: userId, email, name, role } });
  } catch (error) {
    console.log('Error during signup:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user profile
app.get('/make-server-156de6d6/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log('Error fetching profile:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Create event
app.post('/make-server-156de6d6/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to create events' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can create events' }, 403);
    }

    const { name, type, date, time, location, teamId } = await c.req.json();

    if (!name || !type || !date || !time) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const eventId = crypto.randomUUID();
    const event = {
      id: eventId,
      name,
      type,
      date,
      time,
      location: location || '',
      teamId: teamId || null,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`event:${eventId}`, event);

    return c.json({ success: true, event });
  } catch (error) {
    console.log('Error creating event:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get all events
app.get('/make-server-156de6d6/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to view events' }, 401);
    }

    const events = await kv.getByPrefix('event:');
    return c.json({ events: events || [] });
  } catch (error) {
    console.log('Error fetching events:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update event
app.put('/make-server-156de6d6/events/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to update events' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can update events' }, 403);
    }

    const eventId = c.req.param('id');
    const existingEvent = await kv.get(`event:${eventId}`);

    if (!existingEvent) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const updates = await c.req.json();
    const updatedEvent = { ...existingEvent, ...updates };

    await kv.set(`event:${eventId}`, updatedEvent);

    return c.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.log('Error updating event:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete event
app.delete('/make-server-156de6d6/events/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to delete events' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can delete events' }, 403);
    }

    const eventId = c.req.param('id');
    await kv.del(`event:${eventId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting event:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Mark attendance
app.post('/make-server-156de6d6/attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to mark attendance' }, 401);
    }

    const { eventId, status } = await c.req.json();

    if (!eventId || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const attendance = {
      userId: user.id,
      eventId,
      status,
      markedAt: new Date().toISOString(),
    };

    await kv.set(`attendance:${eventId}:${user.id}`, attendance);

    return c.json({ success: true, attendance });
  } catch (error) {
    console.log('Error marking attendance:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get attendance for an event
app.get('/make-server-156de6d6/attendance/:eventId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to view attendance' }, 401);
    }

    const eventId = c.req.param('eventId');
    const attendanceRecords = await kv.getByPrefix(`attendance:${eventId}:`);

    // Get all users to show full roster
    const users = await kv.getByPrefix('user:');
    const athletes = users.filter((u: any) => u.role === 'athlete');

    // Create attendance map
    const attendanceMap = new Map();
    attendanceRecords.forEach((record: any) => {
      attendanceMap.set(record.userId, record.status);
    });

    // Build full attendance list
    const attendanceList = athletes.map((athlete: any) => ({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      status: attendanceMap.get(athlete.id) || 'unknown',
    }));

    return c.json({ attendance: attendanceList });
  } catch (error) {
    console.log('Error fetching attendance:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Create team
app.post('/make-server-156de6d6/teams', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to create teams' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can create teams' }, 403);
    }

    const { name, athleteIds } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Team name is required' }, 400);
    }

    const teamId = crypto.randomUUID();
    const team = {
      id: teamId,
      name,
      athleteIds: athleteIds || [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`team:${teamId}`, team);

    return c.json({ success: true, team });
  } catch (error) {
    console.log('Error creating team:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get all teams
app.get('/make-server-156de6d6/teams', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to view teams' }, 401);
    }

    const teams = await kv.getByPrefix('team:');
    return c.json({ teams: teams || [] });
  } catch (error) {
    console.log('Error fetching teams:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update team
app.put('/make-server-156de6d6/teams/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to update teams' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can update teams' }, 403);
    }

    const teamId = c.req.param('id');
    const existingTeam = await kv.get(`team:${teamId}`);

    if (!existingTeam) {
      return c.json({ error: 'Team not found' }, 404);
    }

    const updates = await c.req.json();
    const updatedTeam = { ...existingTeam, ...updates };

    await kv.set(`team:${teamId}`, updatedTeam);

    return c.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.log('Error updating team:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get all athletes
app.get('/make-server-156de6d6/athletes', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to view athletes' }, 401);
    }

    const users = await kv.getByPrefix('user:');
    const athletes = users.filter((u: any) => u.role === 'athlete');

    return c.json({ athletes: athletes || [] });
  } catch (error) {
    console.log('Error fetching athletes:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get all attendance records
app.get('/make-server-156de6d6/attendance/all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized - must be logged in to view attendance' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'coach') {
      return c.json({ error: 'Only coaches can view all attendance records' }, 403);
    }

    // Get all attendance records
    const attendanceRecords = await kv.getByPrefix('attendance:');
    
    // Get all users to map user IDs to names
    const users = await kv.getByPrefix('user:');
    const userMap = new Map();
    users.forEach((u: any) => {
      userMap.set(u.id, { name: u.name, email: u.email, role: u.role });
    });

    // Enrich attendance records with user info
    const enrichedAttendance = attendanceRecords.map((record: any) => {
      const userInfo = userMap.get(record.userId);
      return {
        ...record,
        name: userInfo?.name || 'Unknown',
        email: userInfo?.email || 'Unknown',
      };
    });

    return c.json({ attendance: enrichedAttendance });
  } catch (error) {
    console.log('Error fetching all attendance:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);