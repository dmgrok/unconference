export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId');
    const query = getQuery(event);
    const userId = query.userId as string;

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      });
    }

    // Load connections from file
    const connectionsPath = process.env.CONNECTIONS_FILE_PATH || './data/connections.json';
    const { readFile } = await import('fs/promises');

    let connections = [];
    try {
      const data = await readFile(connectionsPath, 'utf-8');
      connections = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, return empty array
      return { connections: [] };
    }

    // Filter connections for this event and user
    const userConnections = connections.filter((c: any) =>
      c.eventId === eventId && c.userId === userId
    );

    return { connections: userConnections };

  } catch (error) {
    console.error('Failed to load connections:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load connections'
    });
  }
});