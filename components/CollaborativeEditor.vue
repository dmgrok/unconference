<template>
  <div class="collaborative-editor">
    <!-- Editor Header with Collaborators -->
    <div class="editor-header d-flex align-center justify-space-between pa-2 border-b">
      <div class="d-flex align-center">
        <v-icon color="blue" class="mr-2">mdi-account-multiple</v-icon>
        <span class="text-caption text-medium-emphasis">
          {{ userCount }} {{ userCount === 1 ? 'collaborator' : 'collaborators' }}
        </span>
      </div>

      <div class="d-flex align-center gap-2">
        <!-- Active Users -->
        <v-avatar-group class="mr-2">
          <v-avatar
            v-for="user in activeUsers.slice(0, 5)"
            :key="user.userId"
            size="24"
          >
            <span class="text-caption">{{ user.userName.charAt(0).toUpperCase() }}</span>
            <v-tooltip activator="parent">{{ user.userName }}</v-tooltip>
          </v-avatar>
          <v-avatar v-if="activeUsers.length > 5" size="24">
            <span class="text-caption">+{{ activeUsers.length - 5 }}</span>
          </v-avatar>
        </v-avatar-group>

        <!-- Connection Status -->
        <v-chip
          :color="isConnected ? 'success' : 'error'"
          size="x-small"
          variant="flat"
        >
          <v-icon start size="12">{{ isConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
          {{ isConnected ? 'Online' : 'Offline' }}
        </v-chip>

        <!-- Save Status -->
        <v-chip
          v-if="isSaving || lastSaved"
          :color="isSaving ? 'warning' : 'success'"
          size="x-small"
          variant="outlined"
        >
          <v-icon start size="12">{{ isSaving ? 'mdi-loading' : 'mdi-check' }}</v-icon>
          {{ isSaving ? 'Saving...' : `Saved ${formatTime(lastSaved)}` }}
        </v-chip>
      </div>
    </div>

    <!-- ProseMirror Editor Container -->
    <div
      ref="editorRef"
      class="prosemirror-editor"
      :class="{ 'editor-focused': editorFocused }"
    ></div>

    <!-- Editor Footer -->
    <div class="editor-footer d-flex align-center justify-space-between pa-2 border-t">
      <div class="text-caption text-medium-emphasis">
        {{ wordCount }} words • {{ characterCount }} characters
      </div>

      <div class="d-flex align-center gap-1">
        <v-btn
          size="small"
          variant="text"
          :disabled="!isConnected"
          @click="saveDocument"
        >
          <v-icon size="16">mdi-content-save</v-icon>
          Save
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { keymap } from 'prosemirror-keymap'
import { history, undo, redo } from 'prosemirror-history'
import { yCursorPlugin, yUndoPlugin, ySyncPlugin } from 'y-prosemirror'

interface Props {
  collaborationId: string
  initialContent?: string
  placeholder?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: '',
  placeholder: 'Start writing...',
  readonly: false
})

const emit = defineEmits<{
  contentChange: [content: string]
  ready: []
}>()

const { user } = useUserSession()
const {
  isConnected,
  activeUsers,
  userCount,
  cursors,
  isSaving,
  lastSaved,
  connect,
  disconnect,
  updateCursor,
  saveDocument,
  setupUpdateListener,
  setupAutoSave,
  getSharedText,
  doc
} = useCollaborativeEditing(props.collaborationId)

// Template refs
const editorRef = ref<HTMLElement>()

// Editor state
const editorView = ref<EditorView>()
const editorFocused = ref(false)
const wordCount = ref(0)
const characterCount = ref(0)

// Computed
const userInfo = computed(() => ({
  userId: user.value?.id || 'anonymous',
  userName: user.value?.name || 'Anonymous User'
}))

// Methods
const initializeEditor = async () => {
  if (!editorRef.value || editorView.value) return

  try {
    // Wait for the shared text to be available
    await nextTick()

    const sharedText = getSharedText()

    // Set initial content if provided and text is empty
    if (props.initialContent && sharedText.toString().length === 0) {
      sharedText.insert(0, props.initialContent)
    }

    // Create ProseMirror plugins
    const plugins = [
      ySyncPlugin(sharedText),
      yCursorPlugin(doc.value.getMap('cursors')),
      yUndoPlugin(),
      history(),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo
      })
    ]

    // Create editor state
    const state = EditorState.create({
      schema,
      plugins
    })

    // Create editor view
    editorView.value = new EditorView(editorRef.value, {
      state,
      editable: () => !props.readonly && isConnected.value,
      handleDOMEvents: {
        focus: () => {
          editorFocused.value = true
          return false
        },
        blur: () => {
          editorFocused.value = false
          return false
        }
      },
      dispatchTransaction: (transaction) => {
        if (!editorView.value) return

        const newState = editorView.value.state.apply(transaction)
        editorView.value.updateState(newState)

        // Update cursor position
        const selection = newState.selection
        updateCursor(
          userInfo.value.userId,
          userInfo.value.userName,
          selection.anchor,
          selection.from !== selection.to ? { from: selection.from, to: selection.to } : null
        )

        // Update content stats
        updateContentStats()

        // Emit content change
        emit('contentChange', sharedText.toString())
      }
    })

    // Update content stats initially
    updateContentStats()

    emit('ready')
  } catch (error) {
    console.error('Error initializing editor:', error)
  }
}

const updateContentStats = () => {
  if (!editorView.value) return

  const content = editorView.value.state.doc.textContent
  characterCount.value = content.length
  wordCount.value = content.trim() ? content.trim().split(/\s+/).length : 0
}

const formatTime = (date: Date | null) => {
  if (!date) return ''

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

const focus = () => {
  editorView.value?.focus()
}

const getContent = () => {
  return getSharedText().toString()
}

// Lifecycle
onMounted(async () => {
  if (!user.value) {
    console.warn('User not available for collaborative editing')
    return
  }

  try {
    // Connect to collaboration server
    await connect(userInfo.value.userId, userInfo.value.userName)

    // Setup Yjs listeners
    setupUpdateListener()
    setupAutoSave()

    // Initialize editor after connection
    await initializeEditor()
  } catch (error) {
    console.error('Error setting up collaborative editor:', error)
  }
})

onUnmounted(() => {
  editorView.value?.destroy()
  disconnect()
})

// Watch for connection status changes to update editor editability
watch(isConnected, (connected) => {
  if (editorView.value) {
    // Re-initialize editor view with updated editable state
    const currentState = editorView.value.state
    editorView.value.updateState(currentState)
  }
})

// Expose methods for parent component
defineExpose({
  focus,
  getContent,
  saveDocument
})
</script>

<style scoped>
.collaborative-editor {
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  overflow: hidden;
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-border-color));
}

.border-t {
  border-top: 1px solid rgb(var(--v-border-color));
}

.prosemirror-editor {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
}

.editor-focused {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

:deep(.ProseMirror) {
  padding: 16px;
  outline: none;
  min-height: 200px;
}

:deep(.ProseMirror p) {
  margin: 0 0 12px 0;
}

:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

:deep(.ProseMirror-focused) {
  outline: none;
}

/* Cursor indicators for other users */
:deep(.ProseMirror .yjs-cursor) {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid;
  border-right: 1px solid;
  word-break: normal;
  pointer-events: none;
}

:deep(.ProseMirror .yjs-cursor > .yjs-cursor-caret) {
  position: relative;
  border-left: 1px solid;
  height: 1em;
  word-break: normal;
}

:deep(.ProseMirror .yjs-cursor > .yjs-cursor-caret > .yjs-cursor-caret-inner) {
  position: absolute;
  top: -2px;
  left: -1px;
  width: 2px;
  height: calc(1em + 4px);
  background: inherit;
}

:deep(.ProseMirror .yjs-cursor > .yjs-cursor-name) {
  position: absolute;
  top: -1.5em;
  left: -1px;
  font-size: 12px;
  background: inherit;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}
</style>