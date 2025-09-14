<template>
  <v-card class="work-showcase-form">
    <v-card-title>
      <h3>{{ isEditing ? 'Edit Project' : 'Create New Project Showcase' }}</h3>
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
        <!-- Basic Information -->
        <v-text-field
          v-model="form.projectName"
          label="Project Name"
          :rules="[rules.required, rules.maxLength(100)]"
          placeholder="Enter a catchy project name"
          counter="100"
          variant="outlined"
          class="mb-4"
        />

        <v-textarea
          v-model="form.description"
          label="Project Description"
          :rules="[rules.required, rules.minLength(10), rules.maxLength(2000)]"
          placeholder="Describe your project, its goals, and what makes it exciting..."
          counter="2000"
          rows="4"
          variant="outlined"
          class="mb-4"
        />

        <!-- Status Selection -->
        <v-select
          v-model="form.status"
          :items="statusOptions"
          label="Project Status"
          variant="outlined"
          class="mb-4"
        />

        <!-- Skills Used -->
        <div class="mb-4">
          <v-label class="mb-2">Skills & Technologies Used</v-label>
          <v-combobox
            v-model="form.skillsUsed"
            chips
            multiple
            variant="outlined"
            placeholder="Add skills used in this project..."
            hint="Press Enter to add skills"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                :text="item.raw"
                color="success"
                variant="outlined"
              />
            </template>
          </v-combobox>
        </div>

        <!-- Skills Needed -->
        <div class="mb-4">
          <v-label class="mb-2">Skills & Help Needed</v-label>
          <v-combobox
            v-model="form.skillsNeeded"
            chips
            multiple
            variant="outlined"
            placeholder="What skills or expertise would help this project?"
            hint="Press Enter to add needed skills"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                :text="item.raw"
                color="orange"
                variant="outlined"
              />
            </template>
          </v-combobox>
        </div>

        <!-- Tags -->
        <div class="mb-4">
          <v-label class="mb-2">Tags</v-label>
          <v-combobox
            v-model="form.tags"
            chips
            multiple
            variant="outlined"
            placeholder="Add tags to help others discover your project..."
            hint="Press Enter to add tags"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                :text="item.raw"
                color="primary"
                variant="text"
              />
            </template>
          </v-combobox>
        </div>

        <!-- Contact Information -->
        <v-text-field
          v-model="form.contactEmail"
          label="Contact Email"
          :rules="[rules.email]"
          placeholder="team@example.com"
          variant="outlined"
          class="mb-4"
        />

        <!-- URLs -->
        <v-text-field
          v-model="form.repositoryUrl"
          label="Repository URL"
          :rules="[rules.url]"
          placeholder="https://github.com/username/project"
          variant="outlined"
          class="mb-4"
        />

        <v-text-field
          v-model="form.demoUrl"
          label="Demo URL"
          :rules="[rules.url]"
          placeholder="https://your-project-demo.com"
          variant="outlined"
          class="mb-4"
        />

        <!-- Image Upload -->
        <div class="mb-4">
          <v-label class="mb-2">Project Images</v-label>
          <v-file-input
            ref="fileInput"
            v-model="selectedFiles"
            label="Upload project images"
            multiple
            accept="image/*"
            variant="outlined"
            prepend-icon="mdi-camera"
            :loading="imageUploading"
            @change="handleFileUpload"
          />

          <!-- Image Preview -->
          <div v-if="form.images.length > 0" class="mt-4">
            <div class="d-flex flex-wrap gap-2">
              <div
                v-for="(image, index) in form.images"
                :key="index"
                class="position-relative"
              >
                <v-img
                  :src="image"
                  width="150"
                  height="150"
                  cover
                  class="rounded"
                />
                <v-btn
                  icon="mdi-close"
                  color="error"
                  size="small"
                  class="position-absolute"
                  style="top: -8px; right: -8px;"
                  @click="removeImage(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Contributors Selection (for editing) -->
        <div v-if="isEditing && availableParticipants.length > 0" class="mb-4">
          <v-label class="mb-2">Project Contributors</v-label>
          <v-select
            v-model="form.contributors"
            :items="availableParticipants"
            item-title="name"
            item-value="id"
            multiple
            chips
            variant="outlined"
            placeholder="Select project contributors..."
          >
            <template #chip="{ props, item }">
              <v-chip v-bind="props">
                <v-avatar start>
                  <img v-if="item.raw.avatar" :src="item.raw.avatar">
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
                {{ item.raw.name }}
              </v-chip>
            </template>
          </v-select>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions class="px-6 pb-6">
      <v-btn
        variant="outlined"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        :loading="submitting"
        :disabled="!formValid"
        @click="submitForm"
      >
        {{ isEditing ? 'Update Project' : 'Create Project' }}
      </v-btn>
    </v-card-actions>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
    >
      {{ isEditing ? 'Project updated successfully!' : 'Project created successfully!' }}
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'

interface Props {
  eventId: string
  showcase?: any
  availableParticipants?: Array<{ id: string; name: string; avatar?: string }>
}

interface Emits {
  (e: 'success', showcase: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const formRef = ref()
const formValid = ref(false)
const submitting = ref(false)
const imageUploading = ref(false)
const selectedFiles = ref([])
const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

// Check if we're editing
const isEditing = computed(() => !!props.showcase)

// Form data
const form = reactive({
  projectName: '',
  description: '',
  status: 'IDEATION' as const,
  skillsUsed: [] as string[],
  skillsNeeded: [] as string[],
  tags: [] as string[],
  contactEmail: '',
  repositoryUrl: '',
  demoUrl: '',
  images: [] as string[],
  contributors: [] as string[]
})

// Status options
const statusOptions = [
  { title: 'Idea Stage', value: 'IDEATION' },
  { title: 'In Progress', value: 'ACTIVE' },
  { title: 'Looking for Help', value: 'SEEKING_COLLABORATORS' },
  { title: 'Completed', value: 'COMPLETED' }
]

// Validation rules
const rules = {
  required: (v: any) => !!v || 'This field is required',
  email: (v: string) => !v || /.+@.+\..+/.test(v) || 'Please enter a valid email',
  url: (v: string) => !v || /^https?:\/\/.+/.test(v) || 'Please enter a valid URL',
  minLength: (min: number) => (v: string) => !v || v.length >= min || `Minimum ${min} characters required`,
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Maximum ${max} characters allowed`
}

// Initialize form for editing
if (props.showcase) {
  Object.assign(form, {
    projectName: props.showcase.projectName,
    description: props.showcase.description,
    status: props.showcase.status,
    skillsUsed: props.showcase.skillsUsed || [],
    skillsNeeded: props.showcase.skillsNeeded || [],
    tags: props.showcase.tags || [],
    contactEmail: props.showcase.contactEmail || '',
    repositoryUrl: props.showcase.repositoryUrl || '',
    demoUrl: props.showcase.demoUrl || '',
    images: props.showcase.images || [],
    contributors: props.showcase.contributors || []
  })
}

// Handle file upload
const handleFileUpload = async (files: File[]) => {
  if (!files || files.length === 0) return

  imageUploading.value = true

  try {
    // In a real application, you would upload to a cloud storage service
    // For now, we'll simulate the upload process
    for (const file of files) {
      const imageUrl = await simulateImageUpload(file)
      form.images.push(imageUrl)
    }
  } catch (error) {
    console.error('Error uploading images:', error)
    errorMessage.value = 'Failed to upload images. Please try again.'
    showError.value = true
  } finally {
    imageUploading.value = false
    selectedFiles.value = []
  }
}

// Simulate image upload (replace with actual upload logic)
const simulateImageUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a FileReader to convert to base64 for preview
    const reader = new FileReader()
    reader.onload = () => {
      // In production, upload to cloud storage and return the URL
      resolve(reader.result as string)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Remove image
const removeImage = (index: number) => {
  form.images.splice(index, 1)
}

// Submit form
const submitForm = async () => {
  if (!formValid.value) return

  submitting.value = true

  try {
    const endpoint = isEditing.value
      ? `/api/events/${props.eventId}/showcases/${props.showcase.id}`
      : `/api/events/${props.eventId}/showcases`

    const method = isEditing.value ? 'PUT' : 'POST'

    const response = await $fetch(endpoint, {
      method,
      body: form
    })

    if (response.success) {
      showSuccess.value = true
      emit('success', response.showcase)
    }
  } catch (error: any) {
    console.error('Error submitting form:', error)
    errorMessage.value = error.data?.message || 'Failed to save project. Please try again.'
    showError.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.work-showcase-form {
  max-width: 800px;
  margin: 0 auto;
}

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}

.v-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.875rem;
  display: block;
}
</style>