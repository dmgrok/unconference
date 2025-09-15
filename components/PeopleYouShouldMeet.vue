<template>
  <v-card class="people-recommendations" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-account-heart" class="mr-3" color="primary"></v-icon>
      <span>People You Should Meet</span>
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        @click="refreshRecommendations"
        :loading="loading"
      />
    </v-card-title>

    <v-card-text>
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-body-2 mt-2">Finding your perfect matches...</p>
      </div>

      <div v-else-if="error" class="text-center py-4">
        <v-icon icon="mdi-alert-circle" size="48" color="error" class="mb-2" />
        <p class="text-body-2 text-error">{{ error }}</p>
        <v-btn color="primary" variant="outlined" @click="refreshRecommendations">
          Try Again
        </v-btn>
      </div>

      <div v-else-if="recommendations.length === 0" class="text-center py-4">
        <v-icon icon="mdi-account-search" size="48" color="grey" class="mb-2" />
        <p class="text-body-2">No recommendations yet. Make sure to fill out your skills and interests!</p>
      </div>

      <div v-else>
        <!-- Filter Controls -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="filters.matchTypes"
              :items="matchTypeOptions"
              label="Match Types"
              chips
              multiple
              clearable
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-slider
              v-model="filters.minScore"
              label="Min Compatibility"
              :min="0"
              :max="100"
              :step="10"
              thumb-label
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- Recommendations List -->
        <div class="recommendations-list">
          <v-card
            v-for="rec in filteredRecommendations"
            :key="rec.id"
            class="mb-3 recommendation-card"
            variant="outlined"
          >
            <v-card-text>
              <div class="d-flex align-start">
                <!-- User Avatar & Basic Info -->
                <div class="flex-shrink-0">
                  <v-avatar size="56" class="mr-4">
                    <v-img v-if="rec.user.avatar" :src="rec.user.avatar" :alt="rec.user.name" />
                    <v-icon v-else icon="mdi-account-circle" size="56" />
                  </v-avatar>
                </div>

                <!-- User Details -->
                <div class="flex-grow-1">
                  <div class="d-flex align-center mb-2">
                    <h4 class="text-h6 mr-2">{{ rec.user.name || rec.user.nickname }}</h4>
                    <v-chip
                      :color="getMatchTypeColor(rec.matchType)"
                      size="small"
                      variant="flat"
                    >
                      {{ getMatchTypeLabel(rec.matchType) }}
                    </v-chip>
                    <v-spacer />
                    <div class="text-right">
                      <div class="text-caption">Compatibility</div>
                      <div class="text-h6 font-weight-bold" :class="getScoreColor(rec.compatibilityScore)">
                        {{ rec.compatibilityScore }}%
                      </div>
                    </div>
                  </div>

                  <p v-if="rec.user.bio" class="text-body-2 mb-2">{{ rec.user.bio }}</p>
                  <p class="text-body-2 mb-3">{{ rec.reason }}</p>

                  <!-- Skills & Interests Display -->
                  <div class="mb-3">
                    <div v-if="rec.details.sharedSkills.length > 0" class="mb-2">
                      <span class="text-caption font-weight-bold">Shared Skills:</span>
                      <v-chip
                        v-for="skill in rec.details.sharedSkills.slice(0, 3)"
                        :key="skill"
                        size="small"
                        color="success"
                        variant="outlined"
                        class="ml-1"
                      >
                        {{ skill }}
                      </v-chip>
                      <span v-if="rec.details.sharedSkills.length > 3" class="text-caption ml-2">
                        +{{ rec.details.sharedSkills.length - 3 }} more
                      </span>
                    </div>

                    <div v-if="rec.details.complementarySkills.length > 0" class="mb-2">
                      <span class="text-caption font-weight-bold">Complementary Skills:</span>
                      <v-chip
                        v-for="skill in rec.details.complementarySkills.slice(0, 3)"
                        :key="skill"
                        size="small"
                        color="primary"
                        variant="outlined"
                        class="ml-1"
                      >
                        {{ skill }}
                      </v-chip>
                      <span v-if="rec.details.complementarySkills.length > 3" class="text-caption ml-2">
                        +{{ rec.details.complementarySkills.length - 3 }} more
                      </span>
                    </div>

                    <div v-if="rec.details.mutualInterests.length > 0" class="mb-2">
                      <span class="text-caption font-weight-bold">Mutual Interests:</span>
                      <v-chip
                        v-for="interest in rec.details.mutualInterests.slice(0, 3)"
                        :key="interest"
                        size="small"
                        color="info"
                        variant="outlined"
                        class="ml-1"
                      >
                        {{ interest }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Mentorship Potential -->
                  <div v-if="rec.matchType === 'MENTOR_MENTEE'" class="mb-3">
                    <div v-if="rec.details.mentorshipPotential.canMentor.length > 0" class="mb-1">
                      <v-icon icon="mdi-school" size="small" class="mr-1" color="orange" />
                      <span class="text-caption">You can help with: {{ rec.details.mentorshipPotential.canMentor.join(', ') }}</span>
                    </div>
                    <div v-if="rec.details.mentorshipPotential.canLearnFrom.length > 0">
                      <v-icon icon="mdi-lightbulb" size="small" class="mr-1" color="purple" />
                      <span class="text-caption">You can learn: {{ rec.details.mentorshipPotential.canLearnFrom.join(', ') }}</span>
                    </div>
                  </div>

                  <!-- Strength Indicators -->
                  <v-expansion-panels v-if="showDetails[rec.id]" class="mb-3">
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <span class="text-caption">Match Strength Details</span>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="d-flex flex-column gap-2">
                          <div class="d-flex align-center">
                            <span class="text-caption mr-2" style="min-width: 120px;">Skill Overlap:</span>
                            <v-progress-linear
                              :model-value="rec.details.strengthIndicators.skillOverlap"
                              height="6"
                              color="success"
                              class="flex-grow-1"
                            />
                            <span class="text-caption ml-2">{{ rec.details.strengthIndicators.skillOverlap }}%</span>
                          </div>
                          <div class="d-flex align-center">
                            <span class="text-caption mr-2" style="min-width: 120px;">Goal Alignment:</span>
                            <v-progress-linear
                              :model-value="rec.details.strengthIndicators.goalAlignment"
                              height="6"
                              color="primary"
                              class="flex-grow-1"
                            />
                            <span class="text-caption ml-2">{{ rec.details.strengthIndicators.goalAlignment }}%</span>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- Actions -->
                  <div class="d-flex gap-2">
                    <v-btn
                      color="primary"
                      variant="elevated"
                      size="small"
                      @click="requestIntroduction(rec)"
                      :loading="requestingIntro[rec.id]"
                    >
                      <v-icon icon="mdi-account-plus" class="mr-1" />
                      Request Introduction
                    </v-btn>

                    <v-btn
                      variant="outlined"
                      size="small"
                      @click="toggleDetails(rec.id)"
                    >
                      {{ showDetails[rec.id] ? 'Less Details' : 'More Details' }}
                    </v-btn>

                    <v-btn
                      v-if="rec.user.contactInfo"
                      variant="text"
                      size="small"
                      @click="viewContact(rec.user)"
                    >
                      <v-icon icon="mdi-card-account-details" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center mt-4">
          <v-btn
            variant="outlined"
            @click="loadMore"
            :loading="loadingMore"
          >
            Load More Recommendations
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <!-- Introduction Request Dialog -->
    <v-dialog v-model="introDialog" max-width="600">
      <v-card>
        <v-card-title>Request Introduction</v-card-title>
        <v-card-text>
          <div v-if="selectedRecommendation">
            <p class="mb-4">
              Send an introduction request to <strong>{{ selectedRecommendation.user.name }}</strong>
            </p>

            <v-textarea
              v-model="introForm.reason"
              label="Why would you like to meet?"
              placeholder="e.g., I'd love to discuss React development practices and share insights about our projects..."
              rows="3"
              counter="500"
              :error-messages="introFormErrors.reason"
            />

            <v-textarea
              v-model="introForm.personalMessage"
              label="Personal message (optional)"
              placeholder="Add a personal touch to your introduction request..."
              rows="2"
              counter="1000"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="introDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submitIntroductionRequest"
            :loading="submittingIntro"
          >
            Send Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
interface Recommendation {
  id: string
  user: {
    id: string
    name: string
    nickname?: string
    avatar?: string
    bio?: string
    skills: string[]
    interests: string[]
    lookingFor: string[]
    contactInfo?: {
      linkedin?: string
      twitter?: string
      website?: string
      allowContactSharing: boolean
    }
  }
  matchType: 'COMPLEMENT' | 'SHARED_INTEREST' | 'MENTOR_MENTEE'
  compatibilityScore: number
  reason: string
  details: {
    sharedSkills: string[]
    complementarySkills: string[]
    mutualInterests: string[]
    mentorshipPotential: {
      canMentor: string[]
      canLearnFrom: string[]
    }
    strengthIndicators: {
      skillOverlap: number
      experienceAlignment: number
      goalAlignment: number
      industryFit: number
    }
  }
}

interface Props {
  eventId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 300000 // 5 minutes
})

// State
const recommendations = ref<Recommendation[]>([])
const loading = ref(false)
const error = ref('')
const hasMore = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = 10

// Filters
const filters = ref({
  matchTypes: ['COMPLEMENT', 'SHARED_INTEREST', 'MENTOR_MENTEE'] as string[],
  minScore: 0
})

// UI State
const showDetails = ref<Record<string, boolean>>({})
const requestingIntro = ref<Record<string, boolean>>({})

// Introduction Dialog
const introDialog = ref(false)
const selectedRecommendation = ref<Recommendation | null>(null)
const submittingIntro = ref(false)
const introForm = ref({
  reason: '',
  personalMessage: ''
})
const introFormErrors = ref<Record<string, string[]>>({})

// Options
const matchTypeOptions = [
  { title: 'Complementary Skills', value: 'COMPLEMENT' },
  { title: 'Shared Interests', value: 'SHARED_INTEREST' },
  { title: 'Mentorship', value: 'MENTOR_MENTEE' }
]

// Computed
const filteredRecommendations = computed(() => {
  return recommendations.value.filter(rec =>
    filters.value.matchTypes.includes(rec.matchType) &&
    rec.compatibilityScore >= filters.value.minScore
  )
})

// Methods
const refreshRecommendations = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{recommendations: Recommendation[]}>(`/api/events/${props.eventId}/recommendations/people`, {
      query: {
        includeComplementary: filters.value.matchTypes.includes('COMPLEMENT'),
        includeSharedInterests: filters.value.matchTypes.includes('SHARED_INTEREST'),
        includeMentorship: filters.value.matchTypes.includes('MENTOR_MENTEE'),
        minScore: filters.value.minScore / 100,
        limit: pageSize
      }
    })

    recommendations.value = response.recommendations
    currentPage.value = 1
    hasMore.value = response.recommendations.length === pageSize

  } catch (err: any) {
    console.error('Failed to load recommendations:', err)
    error.value = err.data?.message || 'Failed to load recommendations'
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value) return

  loadingMore.value = true
  try {
    const response = await $fetch<{recommendations: Recommendation[]}>(`/api/events/${props.eventId}/recommendations/people`, {
      query: {
        includeComplementary: filters.value.matchTypes.includes('COMPLEMENT'),
        includeSharedInterests: filters.value.matchTypes.includes('SHARED_INTEREST'),
        includeMentorship: filters.value.matchTypes.includes('MENTOR_MENTEE'),
        minScore: filters.value.minScore / 100,
        limit: pageSize,
        offset: currentPage.value * pageSize
      }
    })

    recommendations.value.push(...response.recommendations)
    currentPage.value++
    hasMore.value = response.recommendations.length === pageSize

  } catch (err) {
    console.error('Failed to load more recommendations:', err)
  } finally {
    loadingMore.value = false
  }
}

const toggleDetails = (id: string) => {
  showDetails.value[id] = !showDetails.value[id]
}

const requestIntroduction = (rec: Recommendation) => {
  selectedRecommendation.value = rec
  introForm.value = {
    reason: `I'd like to connect about ${rec.details.sharedSkills.concat(rec.details.complementarySkills).slice(0, 2).join(' and ')}.`,
    personalMessage: ''
  }
  introDialog.value = true
}

const submitIntroductionRequest = async () => {
  if (!selectedRecommendation.value) return

  // Validate form
  introFormErrors.value = {}
  if (!introForm.value.reason || introForm.value.reason.length < 10) {
    introFormErrors.value.reason = ['Please provide a reason (at least 10 characters)']
    return
  }

  submittingIntro.value = true

  try {
    await $fetch(`/api/events/${props.eventId}/introductions/request`, {
      method: 'POST',
      body: {
        targetPersonId: selectedRecommendation.value.user.id,
        reason: introForm.value.reason,
        personalMessage: introForm.value.personalMessage,
        commonInterests: selectedRecommendation.value.details.sharedSkills.concat(
          selectedRecommendation.value.details.mutualInterests
        )
      }
    })

    // Mark as requested
    requestingIntro.value[selectedRecommendation.value.id] = true

    // Show success message
    // TODO: Add proper toast notification
    console.log('Introduction request sent successfully!')

    introDialog.value = false

  } catch (err: any) {
    console.error('Failed to send introduction request:', err)
    introFormErrors.value.reason = [err.data?.message || 'Failed to send request']
  } finally {
    submittingIntro.value = false
  }
}

const viewContact = (user: Recommendation['user']) => {
  // TODO: Show contact information dialog or navigate to profile
  console.log('View contact for:', user)
}

// Utility functions
const getMatchTypeColor = (type: string) => {
  switch (type) {
    case 'COMPLEMENT': return 'primary'
    case 'SHARED_INTEREST': return 'success'
    case 'MENTOR_MENTEE': return 'orange'
    default: return 'grey'
  }
}

const getMatchTypeLabel = (type: string) => {
  switch (type) {
    case 'COMPLEMENT': return 'Complementary'
    case 'SHARED_INTEREST': return 'Shared Interest'
    case 'MENTOR_MENTEE': return 'Mentorship'
    default: return type
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-primary'
  if (score >= 40) return 'text-warning'
  return 'text-error'
}

// Lifecycle
onMounted(() => {
  refreshRecommendations()

  if (props.autoRefresh) {
    const interval = setInterval(refreshRecommendations, props.refreshInterval)
    onUnmounted(() => clearInterval(interval))
  }
})

// Watch filters
watch(() => filters.value.matchTypes, refreshRecommendations, { deep: true })
watch(() => filters.value.minScore, debounce(refreshRecommendations, 500))

function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}
</script>

<style scoped>
.people-recommendations {
  max-height: 800px;
  overflow-y: auto;
}

.recommendations-list {
  max-height: 600px;
  overflow-y: auto;
}

.recommendation-card {
  transition: all 0.2s ease-in-out;
}

.recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.gap-2 {
  gap: 8px;
}
</style>