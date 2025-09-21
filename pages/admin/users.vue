<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">User Management</h1>
        <p class="text-body-1 mt-2">Manage platform users and permissions</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadUsers">
          Refresh
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-account-plus" @click="inviteUserDialog = true">
          Invite User
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-arrow-left" to="/admin/dashboard">
          Back to Dashboard
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Search users"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="roleFilter"
          :items="roleOptions"
          label="Role Filter"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Status Filter"
          variant="outlined"
          density="compact"
        />
      </v-col>
    </v-row>

    <!-- Users Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        :search="search"
        item-value="id"
      >
        <template #item.globalRole="{ item }">
          <v-chip
            :color="getRoleColor(item.globalRole)"
            :text="item.globalRole || 'User'"
            size="small"
          />
        </template>
        
        <template #item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            :text="item.isActive ? 'Active' : 'Suspended'"
            size="small"
          />
        </template>
        
        <template #item.eventCount="{ item }">
          <div class="d-flex align-center">
            <v-icon size="16" class="mr-1">mdi-calendar-multiple</v-icon>
            {{ item.eventCount }}
          </div>
        </template>
        
        <template #item.lastLoginAt="{ item }">
          {{ item.lastLoginAt ? formatDate(item.lastLoginAt) : 'Never' }}
        </template>
        
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewUser(item)"
              title="View Details"
            />
            <v-btn
              :icon="item.isActive ? 'mdi-account-off' : 'mdi-account-check'"
              :color="item.isActive ? 'warning' : 'success'"
              size="small"
              variant="text"
              @click="toggleUserStatus(item)"
              :title="item.isActive ? 'Suspend User' : 'Activate User'"
            />
            <v-btn
              icon="mdi-account-star"
              color="primary"
              size="small"
              variant="text"
              @click="manageRoles(item)"
              title="Manage Roles"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- User Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedUser">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedUser.name }}</span>
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog = false" />
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <strong>User ID:</strong> {{ selectedUser.id }}
              </div>
              <div class="mb-4">
                <strong>Email:</strong> {{ selectedUser.email }}
              </div>
              <div class="mb-4">
                <strong>Global Role:</strong>
                <v-chip
                  :color="getRoleColor(selectedUser.globalRole)"
                  :text="selectedUser.globalRole || 'User'"
                  size="small"
                  class="ml-2"
                />
              </div>
              <div class="mb-4">
                <strong>Status:</strong>
                <v-chip
                  :color="selectedUser.isActive ? 'success' : 'error'"
                  :text="selectedUser.isActive ? 'Active' : 'Suspended'"
                  size="small"
                  class="ml-2"
                />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <strong>Events:</strong> {{ selectedUser.eventCount }}
              </div>
              <div class="mb-4">
                <strong>Created:</strong> {{ formatDateTime(selectedUser.createdAt) }}
              </div>
              <div class="mb-4">
                <strong>Last Login:</strong> {{ selectedUser.lastLoginAt ? formatDateTime(selectedUser.lastLoginAt) : 'Never' }}
              </div>
            </v-col>
          </v-row>
          
          <!-- User Events -->
          <v-divider class="my-4" />
          <div class="mb-4">
            <strong>Event Memberships:</strong>
            <v-list density="compact" class="mt-2">
              <v-list-item
                v-for="membership in selectedUser.eventMemberships"
                :key="membership.eventId"
              >
                <v-list-item-title>{{ membership.eventName }}</v-list-item-title>
                <v-list-item-subtitle>
                  Role: {{ membership.role }} • Joined: {{ formatDate(membership.joinedAt) }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    :color="membership.role === 'Organizer' ? 'primary' : 'secondary'"
                    :text="membership.role"
                    size="small"
                  />
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            :color="selectedUser.isActive ? 'warning' : 'success'"
            :text="selectedUser.isActive ? 'Suspend User' : 'Activate User'"
            @click="toggleUserStatus(selectedUser)"
          />
          <v-btn color="primary" text="Manage Roles" @click="manageRoles(selectedUser)" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Management Dialog -->
    <v-dialog v-model="roleDialog" max-width="600">
      <v-card v-if="selectedUser">
        <v-card-title>Manage Roles - {{ selectedUser.name }}</v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <strong>Global Role:</strong>
            <v-radio-group v-model="editingUser!.globalRole" inline>
              <v-radio label="User" value="User" />
              <v-radio label="Super Admin" value="Admin" />
            </v-radio-group>
          </div>
          
          <v-divider class="my-4" />
          
          <div class="mb-4">
            <strong>Event-Specific Roles:</strong>
            <v-list density="compact">
              <v-list-item
                v-for="membership in editingUser!.eventMemberships"
                :key="membership.eventId"
              >
                <v-list-item-title>{{ membership.eventName }}</v-list-item-title>
                <template #append>
                  <v-select
                    v-model="membership.role"
                    :items="eventRoleOptions"
                    density="compact"
                    variant="outlined"
                    style="width: 150px"
                  />
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="roleDialog = false" />
          <v-btn color="primary" text="Save Changes" @click="saveRoleChanges" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Invite User Dialog -->
    <v-dialog v-model="inviteUserDialog" max-width="500">
      <v-card>
        <v-card-title>Invite New User</v-card-title>
        
        <v-card-text>
          <v-form ref="inviteForm" v-model="inviteFormValid">
            <v-text-field
              v-model="newUser.name"
              label="Full Name"
              :rules="[v => !!v || 'Name is required']"
              variant="outlined"
              class="mb-4"
            />
            <v-text-field
              v-model="newUser.email"
              label="Email Address"
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
              variant="outlined"
              class="mb-4"
            />
            <v-select
              v-model="newUser.globalRole"
              :items="globalRoleOptions"
              label="Global Role"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="cancelInvite" />
          <v-btn color="primary" text="Send Invite" @click="sendInvite" :disabled="!inviteFormValid" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

interface User {
  id: string
  name: string
  email: string
  globalRole?: 'Admin' | 'User'
  isActive: boolean
  eventCount: number
  createdAt: string
  lastLoginAt?: string
  eventMemberships: {
    eventId: string
    eventName: string
    role: string
    joinedAt: string
  }[]
}

const { user } = useUserSession()

// Check if user is super admin
const isAdmin = computed(() => (user.value as any)?.globalRole === 'SUPER_ADMIN')
if (!isAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Super Admin access required' })
}

// Data
const loading = ref(false)
const users = ref<User[]>([])
const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')
const detailsDialog = ref(false)
const roleDialog = ref(false)
const inviteUserDialog = ref(false)
const selectedUser = ref<User | null>(null)
const editingUser = ref<User | null>(null)
const inviteFormValid = ref(false)

const newUser = ref({
  name: '',
  email: '',
  globalRole: 'User'
})

const roleOptions = [
  { title: 'All Roles', value: 'all' },
  { title: 'Super Admins', value: 'Admin' },
  { title: 'Regular Users', value: 'User' }
]

const statusOptions = [
  { title: 'All Users', value: 'all' },
  { title: 'Active Only', value: 'active' },
  { title: 'Suspended Only', value: 'suspended' }
]

const globalRoleOptions = [
  { title: 'User', value: 'User' },
  { title: 'Super Admin', value: 'Admin' }
]

const eventRoleOptions = [
  { title: 'Organizer', value: 'Organizer' },
  { title: 'Moderator', value: 'Moderator' },
  { title: 'Participant', value: 'Participant' }
]

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Global Role', key: 'globalRole', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Events', key: 'eventCount', sortable: true },
  { title: 'Last Login', key: 'lastLoginAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value

  // Role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(user => user.globalRole === roleFilter.value)
  }

  // Status filter
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(user => user.isActive)
  } else if (statusFilter.value === 'suspended') {
    filtered = filtered.filter(user => !user.isActive)
  }

  return filtered
})

// Methods
async function loadUsers() {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/users') as any
    users.value = response.users || []
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

function viewUser(user: User) {
  selectedUser.value = user
  detailsDialog.value = true
}

function manageRoles(user: User) {
  selectedUser.value = user
  editingUser.value = JSON.parse(JSON.stringify(user)) // Deep clone
  roleDialog.value = true
}

async function toggleUserStatus(user: User) {
  const action = user.isActive ? 'suspend' : 'activate'
  const confirmed = confirm(`Are you sure you want to ${action} this user?`)
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/users/${user.id}/${action}`, {
      method: 'POST'
    })
    await loadUsers()
    if (selectedUser.value?.id === user.id) {
      selectedUser.value = users.value.find(u => u.id === user.id) || null
    }
  } catch (error) {
    console.error(`Failed to ${action} user:`, error)
    alert(`Failed to ${action} user`)
  }
}

async function saveRoleChanges() {
  if (!editingUser.value) return

  try {
    await $fetch(`/api/admin/users/${editingUser.value.id}/roles`, {
      method: 'PUT',
      body: {
        globalRole: editingUser.value.globalRole,
        eventMemberships: editingUser.value.eventMemberships
      }
    })
    await loadUsers()
    roleDialog.value = false
    if (selectedUser.value?.id === editingUser.value.id) {
      selectedUser.value = users.value.find(u => u.id === editingUser.value!.id) || null
    }
  } catch (error) {
    console.error('Failed to save role changes:', error)
    alert('Failed to save role changes')
  }
}

async function sendInvite() {
  try {
    await $fetch('/api/admin/users/invite', {
      method: 'POST',
      body: newUser.value
    })
    inviteUserDialog.value = false
    newUser.value = { name: '', email: '', globalRole: 'User' }
    await loadUsers()
  } catch (error) {
    console.error('Failed to send invite:', error)
    alert('Failed to send invite')
  }
}

function cancelInvite() {
  inviteUserDialog.value = false
  newUser.value = { name: '', email: '', globalRole: 'User' }
}

function getRoleColor(role?: string) {
  switch (role) {
    case 'Admin': return 'error'
    case 'User': return 'primary'
    default: return 'grey'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadUsers()
})
</script>
