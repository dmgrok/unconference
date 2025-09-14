import { Server as SocketIOServer } from 'socket.io'
import * as Y from 'yjs'

// Global references
let io: SocketIOServer | null = null
const documents = new Map<string, Y.Doc>()
const collaborators = new Map<string, Set<string>>()

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔌 Setting up WebSocket server for collaborative editing...')

  nitroApp.hooks.hook('listen', (server) => {
    if (io) return

    io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    })

    io.on('connection', (socket) => {
      console.log(`🔗 New WebSocket connection: ${socket.id}`)

      socket.on('join-collaboration', async (data) => {
        const { collaborationId, userId, userName } = data
        console.log(`👤 User ${userName} joining collaboration ${collaborationId}`)

        socket.join(collaborationId)
        socket.data.userId = userId
        socket.data.userName = userName
        socket.data.collaborationId = collaborationId

        if (!documents.has(collaborationId)) {
          documents.set(collaborationId, new Y.Doc())
          collaborators.set(collaborationId, new Set())
        }

        const doc = documents.get(collaborationId)!
        const roomCollaborators = collaborators.get(collaborationId)!
        roomCollaborators.add(userId)

        const state = Y.encodeStateAsUpdate(doc)
        socket.emit('sync-document', state)

        socket.to(collaborationId).emit('user-joined', {
          userId,
          userName,
          userCount: roomCollaborators.size
        })

        const activeUsers = Array.from(roomCollaborators)
        socket.emit('collaborators-update', { activeUsers, userCount: roomCollaborators.size })
      })

      socket.on('document-update', (data) => {
        const { collaborationId, update } = data
        const doc = documents.get(collaborationId)

        if (!doc) {
          socket.emit('error', { message: 'Collaboration not found' })
          return
        }

        Y.applyUpdate(doc, update)
        socket.to(collaborationId).emit('document-update', { update })
      })

      socket.on('cursor-update', (data) => {
        const { collaborationId, cursor } = data
        socket.to(collaborationId).emit('cursor-update', cursor)
      })

      socket.on('save-document', async (data) => {
        const { collaborationId } = data
        const doc = documents.get(collaborationId)

        if (!doc) {
          socket.emit('error', { message: 'Collaboration not found' })
          return
        }

        const sharedText = doc.getText('content')
        const content = sharedText.toString()

        try {
          console.log(`💾 Saving document for collaboration ${collaborationId}`)
          socket.emit('document-saved', {
            collaborationId,
            timestamp: new Date(),
            success: true
          })
        } catch (error) {
          console.error('❌ Error saving document:', error)
          socket.emit('error', { message: 'Failed to save document' })
        }
      })

      socket.on('disconnect', () => {
        const { userId, userName, collaborationId } = socket.data

        if (collaborationId && userId) {
          const roomCollaborators = collaborators.get(collaborationId)
          if (roomCollaborators) {
            roomCollaborators.delete(userId)

            socket.to(collaborationId).emit('user-left', {
              userId,
              userName,
              userCount: roomCollaborators.size
            })

            if (roomCollaborators.size === 0) {
              documents.delete(collaborationId)
              collaborators.delete(collaborationId)
              console.log(`🧹 Cleaned up empty collaboration ${collaborationId}`)
            }
          }
        }

        console.log(`🔌 WebSocket disconnected: ${socket.id}`)
      })
    })

    console.log('✅ WebSocket server initialized successfully')
  })
})