<template>
  <div class="simple-networking">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        Connections Made
      </v-card-title>

      <v-card-text>
        <!-- Add new connection -->
        <div class="add-connection mb-4">
          <v-autocomplete
            v-model="selectedParticipant"
            :items="availableParticipants"
            item-title="name"
            item-value="id"
            label="I connected with..."
            density="compact"
            clearable
            @update:model-value="addConnection"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-avatar size="small">
                    <img v-if="item.raw.avatar" :src="item.raw.avatar" />
                    <span v-else>{{ item.raw.name.charAt(0) }}</span>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </div>

        <!-- Connections list -->
        <div v-if="connections.length > 0" class="connections-list">
          <h4 class="mb-2">Your Connections ({{ connections.length }})</h4>

          <v-list density="compact">
            <v-list-item
              v-for="connection in connections"
              :key="connection.id"
              class="connection-item"
            >
              <template #prepend>
                <v-avatar size="small">
                  <img v-if="connection.participant.avatar" :src="connection.participant.avatar" />
                  <span v-else>{{ connection.participant.name.charAt(0) }}</span>
                </v-avatar>
              </template>

              <v-list-item-title>{{ connection.participant.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Connected {{ formatTimeAgo(connection.connectedAt) }}
              </v-list-item-subtitle>

              <template #append>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" size="small" v-bind="props" />
                  </template>
                  <v-list>
                    <v-list-item @click="addFollowUpNote(connection.id)">
                      <v-list-item-title>Add Follow-up Note</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="removeConnection(connection.id)">
                      <v-list-item-title>Remove Connection</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state text-center py-4">
          <v-icon size="48" color="grey-lighten-1">mdi-account-plus</v-icon>
          <p class="text-grey mt-2">No connections yet. Add people you've met!</p>
        </div>

        <!-- Follow-up reminder -->
        <div v-if="connections.length > 0" class="follow-up-reminder mt-4">
          <v-alert
            type="info"
            density="compact"
            icon="mdi-clock-outline"
            class="text-caption"
          >
            💡 Tip: Follow up within 24 hours while the conversation is fresh!
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- Follow-up note modal -->
    <v-dialog v-model="showFollowUpModal" max-width="400">
      <v-card>
        <v-card-title>Add Follow-up Note</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="followUpNote"
            label="What should you follow up about?"
            placeholder="e.g., Send them the article about X, Connect them with Y, Schedule coffee..."
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showFollowUpModal = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveFollowUpNote">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Connection {
  id: string;
  participantId: string;
  participant: Participant;
  connectedAt: Date;
  followUpNote?: string;
}

const props = defineProps<{
  eventId: string;
  currentUserId: string;
}>();

// State
const selectedParticipant = ref<string | null>(null);
const connections = ref<Connection[]>([]);
const availableParticipants = ref<Participant[]>([]);
const showFollowUpModal = ref(false);
const followUpNote = ref('');
const selectedConnectionId = ref<string | null>(null);

// Load data
onMounted(async () => {
  await Promise.all([
    loadConnections(),
    loadParticipants()
  ]);
});

const loadConnections = async () => {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/connections`, {
      query: { userId: props.currentUserId }
    });
    connections.value = response.connections || [];
  } catch (error) {
    console.error('Failed to load connections:', error);
  }
};

const loadParticipants = async () => {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/participants`);
    // Filter out current user and already connected participants
    availableParticipants.value = response.participants.filter((p: Participant) =>
      p.id !== props.currentUserId &&
      !connections.value.some(c => c.participantId === p.id)
    );
  } catch (error) {
    console.error('Failed to load participants:', error);
  }
};

const addConnection = async (participantId: string | null) => {
  if (!participantId) return;

  try {
    await $fetch(`/api/events/${props.eventId}/connections`, {
      method: 'POST',
      body: {
        participantId,
        userId: props.currentUserId
      }
    });

    // Reload data
    await Promise.all([
      loadConnections(),
      loadParticipants()
    ]);

    selectedParticipant.value = null;

  } catch (error) {
    console.error('Failed to add connection:', error);
  }
};

const removeConnection = async (connectionId: string) => {
  try {
    await $fetch(`/api/events/${props.eventId}/connections/${connectionId}`, {
      method: 'DELETE'
    });

    // Reload data
    await Promise.all([
      loadConnections(),
      loadParticipants()
    ]);

  } catch (error) {
    console.error('Failed to remove connection:', error);
  }
};

const addFollowUpNote = (connectionId: string) => {
  selectedConnectionId.value = connectionId;
  const connection = connections.value.find(c => c.id === connectionId);
  followUpNote.value = connection?.followUpNote || '';
  showFollowUpModal.value = true;
};

const saveFollowUpNote = async () => {
  if (!selectedConnectionId.value) return;

  try {
    await $fetch(`/api/events/${props.eventId}/connections/${selectedConnectionId.value}`, {
      method: 'PATCH',
      body: {
        followUpNote: followUpNote.value
      }
    });

    await loadConnections();
    showFollowUpModal.value = false;
    followUpNote.value = '';
    selectedConnectionId.value = null;

  } catch (error) {
    console.error('Failed to save follow-up note:', error);
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
};
</script>

<style scoped>
.connection-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.empty-state {
  opacity: 0.7;
}

.follow-up-reminder {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}
</style>