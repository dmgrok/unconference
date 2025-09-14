import { io, type Socket } from 'socket.io-client'
import * as Y from 'yjs'
import { ref, onUnmounted, readonly } from 'vue'
import logger from '~/utils/logger'

export interface CollaborativeUser {
  userId: string
  userName: string
}

export interface CursorInfo extends CollaborativeUser {
  position: number
  selection: { from: number; to: number } | null
}

export const useCollaborativeEditing = (collaborationId: string) => {
  const socket = ref<Socket | null>(null)
  const doc = ref<Y.Doc>(new Y.Doc())
  const isConnected = ref(false)
  const activeUsers = ref<CollaborativeUser[]>([])
  const userCount = ref(0)
  const cursors = ref<Map<string, CursorInfo>>(new Map())
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)

  const connect = async (userId: string, userName: string) => {
    try {
      if (process.client) {
        socket.value = io({
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true
        })

        socket.value.on('connect', () => {
          logger.info('Connected to collaborative editing server')
          isConnected.value = true

          // Join the collaboration room
          socket.value?.emit('join-collaboration', {
            collaborationId,
            userId,
            userName
          })
        })

        socket.value.on('sync-document', (state: Uint8Array) => {
          try {
            Y.applyUpdate(doc.value, state)
            logger.debug('Document synchronized')
          } catch (error) {
            logger.error('Error syncing document:', error)
          }
        })

        socket.value.on('document-update', ({ update }: { update: Uint8Array }) => {
          try {
            Y.applyUpdate(doc.value, update)
            logger.debug('Received document update')
          } catch (error) {
            logger.error('Error applying document update:', error)
          }
        })

        socket.value.on('user-joined', ({ userId: newUserId, userName: newUserName, userCount: count }: {
          userId: string;
          userName: string;
          userCount: number;
        }) => {
          logger.info(`User ${newUserName} joined collaboration`)
          userCount.value = count
        })

        socket.value.on('user-left', ({ userId: leftUserId, userName: leftUserName, userCount: count }: {
          userId: string;
          userName: string;
          userCount: number;
        }) => {
          logger.info(`User ${leftUserName} left collaboration`)
          userCount.value = count
          cursors.value.delete(leftUserId)
        })

        socket.value.on('collaborators-update', ({ activeUsers: users, userCount: count }: {
          activeUsers: string[];
          userCount: number;
        }) => {
          activeUsers.value = users.map(id => ({ userId: id, userName: `User ${id}` }))
          userCount.value = count
        })

        socket.value.on('cursor-update', (cursor: CursorInfo) => {
          cursors.value.set(cursor.userId, cursor)
        })

        socket.value.on('document-saved', ({ timestamp }: { timestamp: string }) => {
          isSaving.value = false
          lastSaved.value = new Date(timestamp)
          logger.info('Document saved successfully')
        })

        socket.value.on('error', ({ message }: { message: string }) => {
          logger.error('Collaboration error:', message)
        })

        socket.value.on('disconnect', () => {
          logger.info('Disconnected from collaborative editing server')
          isConnected.value = false
        })
      }
    } catch (error) {
      logger.error('Error connecting to collaborative editing server:', error)
    }
  }

  const sendUpdate = (update: Uint8Array) => {
    if (socket.value?.connected) {
      socket.value.emit('document-update', {
        collaborationId,
        update
      })
    }
  }

  const updateCursor = (userId: string, userName: string, position: number, selection: { from: number; to: number } | null = null) => {
    if (socket.value?.connected) {
      socket.value.emit('cursor-update', {
        collaborationId,
        cursor: {
          userId,
          userName,
          position,
          selection
        }
      })
    }
  }

  const saveDocument = () => {
    if (socket.value?.connected) {
      isSaving.value = true
      socket.value.emit('save-document', {
        collaborationId
      })
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    isConnected.value = false
  }

  const getSharedText = () => {
    return doc.value.getText('content')
  }

  const insertText = (index: number, text: string) => {
    const sharedText = getSharedText()
    sharedText.insert(index, text)
  }

  const deleteText = (index: number, length: number) => {
    const sharedText = getSharedText()
    sharedText.delete(index, length)
  }

  const getText = () => {
    return getSharedText().toString()
  }

  // Set up Yjs update listener to send updates to other clients
  const setupUpdateListener = () => {
    doc.value.on('update', (update: Uint8Array) => {
      sendUpdate(update)
    })
  }

  // Auto-save every 30 seconds
  const setupAutoSave = () => {
    if (process.client) {
      setInterval(() => {
        if (isConnected.value && !isSaving.value) {
          saveDocument()
        }
      }, 30000)
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    // Connection state
    isConnected: readonly(isConnected),
    activeUsers: readonly(activeUsers),
    userCount: readonly(userCount),
    cursors: readonly(cursors),
    isSaving: readonly(isSaving),
    lastSaved: readonly(lastSaved),

    // Methods
    connect,
    disconnect,
    updateCursor,
    saveDocument,
    setupUpdateListener,
    setupAutoSave,

    // Document operations
    getText,
    insertText,
    deleteText,
    getSharedText,

    // Yjs document
    doc: readonly(doc)
  }
}