import { z } from 'zod';

const connectionSchema = z.object({
  participantId: z.string(),
  userId: z.string()
});

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId');
    const body = await readBody(event);
    const { participantId, userId } = connectionSchema.parse(body);

    // Simple file-based storage for connections
    const connectionsPath = process.env.CONNECTIONS_FILE_PATH || './data/connections.json';

    // Load existing connections
    const { readFile, writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');

    await mkdir(dirname(connectionsPath), { recursive: true });

    let connections = [];
    try {
      const data = await readFile(connectionsPath, 'utf-8');
      connections = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    // Check if connection already exists
    const existingConnection = connections.find((c: any) =>
      c.eventId === eventId &&
      c.userId === userId &&
      c.participantId === participantId
    );

    if (existingConnection) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Connection already exists'
      });
    }

    // Load participant info
    const usersPath = process.env.NUXT_USERS_FILE_PATH || './data/users.json';
    let users = [];
    try {
      const userData = await readFile(usersPath, 'utf-8');
      users = JSON.parse(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }

    const participant = users.find((u: any) => u.id === participantId);
    if (!participant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found'
      });
    }

    // Create new connection
    const newConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      userId,
      participantId,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        avatar: participant.avatar
      },
      connectedAt: new Date().toISOString(),
      followUpNote: null
    };

    connections.push(newConnection);

    // Save back to file
    await writeFile(connectionsPath, JSON.stringify(connections, null, 2));

    return { success: true, connection: newConnection };

  } catch (error) {
    console.error('Connection creation error:', error);
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create connection'
    });
  }
});