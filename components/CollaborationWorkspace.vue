<template>
  <v-card class="collaboration-workspace" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon color="blue" class="mr-2">mdi-handshake</v-icon>
      {{ workspace.name }}
      <v-spacer></v-spacer>
      <v-chip :color="statusColor" size="small">
        {{ workspace.status }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Description -->
      <div class="mb-4">
        <p>{{ workspace.description }}</p>
      </div>

      <!-- Contributors -->
      <div class="mb-4">
        <h4 class="text-subtitle-1 mb-2">Contributors</h4>
        <v-avatar-group class="mb-2">
          <v-avatar 
            v-for="contributor in contributors"
            :key="contributor.id"
            size="32"
          >
            <img v-if="contributor.avatar" :src="contributor.avatar">
            <v-icon v-else>mdi-account</v-icon>
            <v-tooltip activator="parent">{{ contributor.name }}</v-tooltip>
          </v-avatar>
          <v-btn 
            icon 
            size="32" 
            variant="outlined" 
            @click="inviteCollaborator"
          >
            <v-icon>mdi-plus</v-icon>
            <v-tooltip activator="parent">Invite someone</v-tooltip>
          </v-btn>
        </v-avatar-group>
      </div>

      <!-- Shared Notes -->
      <div class="mb-4">
        <h4 class="text-subtitle-1 mb-2">Shared Notes</h4>
        <CollaborativeEditor
          :collaboration-id="props.workspaceId"
          :initial-content="sharedNotes"
          placeholder="Start collaborating on shared notes..."
          @content-change="onNotesContentChange"
          @ready="onEditorReady"
        />
      </div>

      <!-- Action Items -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <h4 class="text-subtitle-1">Action Items</h4>
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddActionDialog = true"
          >
            Add Task
          </v-btn>
        </div>
        
        <v-list v-if="actionItems.length > 0" density="compact">
          <v-list-item
            v-for="item in actionItems"
            :key="item.id"
          >
            <template #prepend>
              <v-checkbox
                :model-value="item.status === 'COMPLETED'"
                @update:model-value="toggleActionItem(item)"
              ></v-checkbox>
            </template>
            <v-list-item-title 
              :class="{ 'text-decoration-line-through': item.status === 'COMPLETED' }"
            >
              {{ item.task }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Assigned to: {{ getAssigneeName(item.assignedTo) }}
              <span v-if="item.dueDate"> • Due: {{ formatDate(item.dueDate) }}</span>
              <v-chip 
                :color="getPriorityColor(item.priority)" 
                size="x-small" 
                class="ml-2"
              >
                {{ item.priority }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center text-medium-emphasis py-4">
          No action items yet. Add one to get started!
        </div>
      </div>

      <!-- Resources -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <h4 class="text-subtitle-1">Shared Resources</h4>
          <v-btn
            size="small"
            color="success"
            prepend-icon="mdi-link"
            @click="showAddResourceDialog = true"
          >
            Add Resource
          </v-btn>
        </div>
        
        <v-list v-if="resources.length > 0" density="compact">
          <v-list-item
            v-for="resource in resources"
            :key="resource.id"
            :href="resource.url"
            target="_blank"
          >
            <template #prepend>
              <v-icon :color="getResourceTypeColor(resource.resourceType)">
                {{ getResourceTypeIcon(resource.resourceType) }}
              </v-icon>
            </template>
            <v-list-item-title>{{ resource.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ resource.description }}
              <span class="text-caption"> • Added by {{ getAddedByName(resource.addedBy) }}</span>
            </v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-thumb-up" size="small" variant="text">
                <v-icon>mdi-thumb-up</v-icon>
                <span class="text-caption ml-1">{{ resource.votes }}</span>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center text-medium-emphasis py-4">
          No resources shared yet. Add helpful links, documents, or tools!
        </div>
      </div>

      <!-- Integration Actions -->
      <div class="d-flex gap-2 flex-wrap">
        <v-btn 
          color="orange" 
          variant="outlined" 
          prepend-icon="mdi-slack"
          @click="createSlackChannel"
        >
          Create Slack Channel
        </v-btn>
        <v-btn 
          color="blue" 
          variant="outlined" 
          prepend-icon="mdi-calendar"
          @click="scheduleFollowUp"
        >
          Schedule Follow-up
        </v-btn>
        <v-btn 
          color="purple" 
          variant="outlined" 
          prepend-icon="mdi-share-variant"
          @click="shareWorkspace"
        >
          Share Workspace
        </v-btn>
      </div>
    </v-card-text>

    <!-- Add Action Item Dialog -->
    <v-dialog v-model="showAddActionDialog" max-width="500px">
      <v-card>
        <v-card-title>Add Action Item</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newActionItem.task"
            label="Task description"
            required
          ></v-text-field>
          <v-textarea
            v-model="newActionItem.description"
            label="Details (optional)"
            rows="2"
          ></v-textarea>
          <v-select
            v-model="newActionItem.assignedTo"
            :items="contributors"
            item-title="name"
            item-value="id"
            label="Assign to"
            required
          ></v-select>
          <v-text-field
            v-model="newActionItem.dueDate"
            label="Due date (optional)"
            type="date"
          ></v-text-field>
          <v-select
            v-model="newActionItem.priority"
            :items="['LOW', 'MEDIUM', 'HIGH']"
            label="Priority"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAddActionDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="handleAddActionItem">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Resource Dialog -->
    <v-dialog v-model="showAddResourceDialog" max-width="500px">
      <v-card>
        <v-card-title>Add Resource</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newResource.url"
            label="URL"
            required
          ></v-text-field>
          <v-text-field
            v-model="newResource.title"
            label="Title"
            required
          ></v-text-field>
          <v-textarea
            v-model="newResource.description"
            label="Description (optional)"
            rows="2"
          ></v-textarea>
          <v-select
            v-model="newResource.resourceType"
            :items="['LINK', 'DOCUMENT', 'TOOL', 'ARTICLE']"
            label="Type"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAddResourceDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addResourceItem">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  workspaceId: string
  topicId?: string
  roomId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updated: [workspace: any]
}>()

// Get connections API
const { 
  getCollaborations,
  addResource,
  addActionItem
} = useConnections()

// Reactive data
const workspace = ref<any>({
  id: props.workspaceId,
  name: 'Collaboration Space',
  description: 'Work together on ideas and projects',
  status: 'ACTIVE',
  contributors: []
})

const contributors = ref<any[]>([])
const actionItems = ref<any[]>([])
const resources = ref<any[]>([])
const sharedNotes = ref('')
const editorReady = ref(false)

// Dialog states
const showAddActionDialog = ref(false)
const showAddResourceDialog = ref(false)

// Form data
const newActionItem = ref({
  task: '',
  description: '',
  assignedTo: '',
  dueDate: '',
  priority: 'MEDIUM'
})

const newResource = ref({
  url: '',
  title: '',
  description: '',
  resourceType: 'LINK'
})

// Computed
const statusColor = computed(() => {
  switch (workspace.value.status) {
    case 'ACTIVE': return 'success'
    case 'COMPLETED': return 'primary'
    case 'ON_HOLD': return 'warning'
    default: return 'grey'
  }
})

// Methods
const loadWorkspace = async () => {
  try {
    const data = await getCollaborations()
    if (data?.collaborations?.length > 0) {
      const collab = data.collaborations.find((c: any) => c.id === props.workspaceId)
      if (collab) {
        workspace.value = collab
        actionItems.value = collab.actionItems || []
        resources.value = collab.resources || []
        sharedNotes.value = collab.sharedNotes || ''
      }
    }
  } catch (error) {
    console.error('Failed to load workspace:', error)
  }
}

const onNotesContentChange = (content: string) => {
  sharedNotes.value = content
  // Emit update to parent component
  emit('updated', { ...workspace.value, sharedNotes: content })
}

const onEditorReady = () => {
  editorReady.value = true
}

const handleAddActionItem = async () => {
  try {
    await addActionItem({
      collaborationId: workspace.value.id,
      ...newActionItem.value
    })
    
    showAddActionDialog.value = false
    newActionItem.value = {
      task: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'MEDIUM'
    }
    await loadWorkspace()
  } catch (error) {
    console.error('Failed to add action item:', error)
  }
}

const toggleActionItem = async (item: any) => {
  item.status = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
  // API call to update status would go here
}

const addResourceItem = async () => {
  try {
    await addResource({
      collaborationId: workspace.value.id,
      ...newResource.value
    })
    
    showAddResourceDialog.value = false
    newResource.value = {
      url: '',
      title: '',
      description: '',
      resourceType: 'LINK'
    }
    await loadWorkspace()
  } catch (error) {
    console.error('Failed to add resource:', error)
  }
}

const getAssigneeName = (userId: string) => {
  const user = contributors.value.find(c => c.id === userId)
  return user?.name || 'Unknown'
}

const getAddedByName = (userId: string) => {
  const user = contributors.value.find(c => c.id === userId)
  return user?.name || 'Unknown'
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'red'
    case 'MEDIUM': return 'orange'
    case 'LOW': return 'green'
    default: return 'grey'
  }
}

const getResourceTypeColor = (type: string) => {
  switch (type) {
    case 'LINK': return 'blue'
    case 'DOCUMENT': return 'green'
    case 'TOOL': return 'orange'
    case 'ARTICLE': return 'purple'
    default: return 'grey'
  }
}

const getResourceTypeIcon = (type: string) => {
  switch (type) {
    case 'LINK': return 'mdi-link'
    case 'DOCUMENT': return 'mdi-file-document'
    case 'TOOL': return 'mdi-wrench'
    case 'ARTICLE': return 'mdi-newspaper'
    default: return 'mdi-file'
  }
}

const inviteCollaborator = () => {
  // Implementation for inviting collaborators
  console.log('Inviting collaborator')
}

const createSlackChannel = () => {
  // Implementation for creating Slack channel
  console.log('Creating Slack channel')
}

const scheduleFollowUp = () => {
  // Implementation for scheduling follow-up
  console.log('Scheduling follow-up')
}

const shareWorkspace = () => {
  // Implementation for sharing workspace
  console.log('Sharing workspace')
}

onMounted(loadWorkspace)
</script>

<style scoped>
.collaboration-workspace {
  max-width: 100%;
}
</style>
