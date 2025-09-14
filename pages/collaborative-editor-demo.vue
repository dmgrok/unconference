<template>
  <div class="collaborative-demo pa-6">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">
            <v-icon color="blue" class="mr-2">mdi-account-multiple-plus</v-icon>
            Real-time Collaborative Editing Demo
          </h1>

          <v-alert
            type="info"
            variant="tonal"
            class="mb-6"
          >
            <template #title>How to test collaborative editing</template>
            <div class="mt-2">
              <ol class="ml-4">
                <li>Open this page in multiple browser tabs or windows</li>
                <li>Start typing in the editor - you should see changes appear in real-time across all tabs</li>
                <li>Watch the collaborator indicators at the top of the editor</li>
                <li>Changes are auto-saved every 30 seconds or when you click Save</li>
              </ol>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="8">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-file-document-edit</v-icon>
              Shared Document
            </v-card-title>
            <v-card-text>
              <CollaborativeEditor
                :collaboration-id="demoCollaborationId"
                :initial-content="initialContent"
                placeholder="Start typing to test collaborative editing..."
                @content-change="onContentChange"
                @ready="onEditorReady"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card elevation="1" class="mb-4">
            <v-card-title class="text-subtitle-1">
              <v-icon color="success" size="20" class="mr-2">mdi-information</v-icon>
              Editor Status
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon :color="editorReady ? 'success' : 'warning'">
                      {{ editorReady ? 'mdi-check-circle' : 'mdi-clock' }}
                    </v-icon>
                  </template>
                  <v-list-item-title>Editor Ready</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ editorReady ? 'Ready for collaboration' : 'Initializing...' }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="info">mdi-text-long</v-icon>
                  </template>
                  <v-list-item-title>Content Length</v-list-item-title>
                  <v-list-item-subtitle>{{ contentLength }} characters</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary">mdi-update</v-icon>
                  </template>
                  <v-list-item-title>Last Updated</v-list-item-title>
                  <v-list-item-subtitle>{{ lastUpdate }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card elevation="1">
            <v-card-title class="text-subtitle-1">
              <v-icon color="orange" size="20" class="mr-2">mdi-test-tube</v-icon>
              Testing Instructions
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="blue">mdi-numeric-1-circle</v-icon>
                  </template>
                  <v-list-item-title>Multi-Tab Test</v-list-item-title>
                  <v-list-item-subtitle>Open in multiple tabs and type simultaneously</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="green">mdi-numeric-2-circle</v-icon>
                  </template>
                  <v-list-item-title>Cursor Tracking</v-list-item-title>
                  <v-list-item-subtitle>Watch other users' cursor positions</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="purple">mdi-numeric-3-circle</v-icon>
                  </template>
                  <v-list-item-title>Auto-Save</v-list-item-title>
                  <v-list-item-subtitle>Changes save automatically every 30s</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="red">mdi-numeric-4-circle</v-icon>
                  </template>
                  <v-list-item-title>Conflict Resolution</v-list-item-title>
                  <v-list-item-subtitle>Edit the same line from multiple tabs</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="1" color="grey-lighten-5">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">
                <strong>Technical Details:</strong> This demo uses Yjs for Conflict-free Replicated Data Types (CRDT),
                ProseMirror for rich text editing, and Socket.IO for real-time communication.
                The collaborative state is synchronized across all connected clients without conflicts.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Collaborative Editor Demo',
  description: 'Test real-time collaborative editing functionality'
})

const demoCollaborationId = 'demo-collaboration-space'
const editorReady = ref(false)
const contentLength = ref(0)
const lastUpdate = ref('Never')

const initialContent = `# Welcome to Real-time Collaborative Editing!

This is a demonstration of real-time collaborative text editing using:

## Technologies Used
- **Yjs** - Conflict-free Replicated Data Types (CRDT)
- **ProseMirror** - Rich text editor
- **Socket.IO** - Real-time communication
- **Vue 3** - Reactive frontend framework

## How to Test
1. Open this page in multiple browser tabs
2. Start typing in different tabs simultaneously
3. Notice how changes appear instantly across all instances
4. Try editing the same line from multiple tabs - conflicts are resolved automatically!

## Features
- ✅ Real-time synchronization
- ✅ Conflict-free editing
- ✅ User presence indicators
- ✅ Cursor tracking
- ✅ Auto-save functionality
- ✅ Connection status monitoring

Start typing below to see collaborative editing in action...`

const onContentChange = (content: string) => {
  contentLength.value = content.length
  lastUpdate.value = new Date().toLocaleTimeString()
}

const onEditorReady = () => {
  editorReady.value = true
}
</script>

<style scoped>
.collaborative-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.text-caption {
  line-height: 1.4;
}
</style>