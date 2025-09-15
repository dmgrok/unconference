<template>
  <v-card
    :class="cardClasses"
    :elevation="elevation"
    :variant="variant"
    :color="color"
    @click="handleClick"
    class="mobile-card"
    :style="cardStyle"
  >
    <!-- Card Header -->
    <v-card-title v-if="title || $slots.title" class="mobile-card-title" :class="titleClasses">
      <slot name="title">
        <div class="d-flex align-center">
          <v-avatar
            v-if="avatar"
            :color="avatarColor"
            :size="avatarSize"
            class="mr-3"
          >
            <v-icon v-if="avatarIcon" color="white">{{ avatarIcon }}</v-icon>
            <span v-else-if="avatarText" class="text-caption font-weight-bold">{{ avatarText }}</span>
          </v-avatar>

          <div class="flex-grow-1 min-width-0">
            <h3 class="card-title text-truncate">{{ title }}</h3>
            <p v-if="subtitle" class="card-subtitle text-truncate">{{ subtitle }}</p>
          </div>

          <!-- Header Actions -->
          <div v-if="$slots.headerActions" class="header-actions">
            <slot name="headerActions" />
          </div>

          <!-- Status Indicator -->
          <v-chip
            v-if="status"
            :color="statusColor"
            :variant="statusVariant"
            size="small"
            class="ml-2"
          >
            <v-icon v-if="statusIcon" start size="small">{{ statusIcon }}</v-icon>
            {{ status }}
          </v-chip>
        </div>
      </slot>
    </v-card-title>

    <!-- Card Image -->
    <v-img
      v-if="image"
      :src="image"
      :alt="imageAlt"
      :height="imageHeight"
      :cover="imageCover"
      class="mobile-card-image"
    >
      <div v-if="imageOverlay" class="image-overlay">
        <slot name="imageOverlay" />
      </div>
    </v-img>

    <!-- Card Content -->
    <v-card-text v-if="$slots.default || content" class="mobile-card-content" :class="contentClasses">
      <slot>
        <p v-if="content" class="card-content">{{ content }}</p>
      </slot>
    </v-card-text>

    <!-- Card Stats/Metrics -->
    <div v-if="$slots.stats || stats?.length" class="card-stats" :class="statsClasses">
      <slot name="stats">
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-item text-center"
          >
            <div class="stat-value text-h6 font-weight-bold" :style="{ color: stat.color }">
              {{ stat.value }}
            </div>
            <div class="stat-label text-caption text-grey">{{ stat.label }}</div>
          </div>
        </div>
      </slot>
    </div>

    <!-- Card Tags -->
    <div v-if="tags?.length || $slots.tags" class="card-tags pa-3">
      <slot name="tags">
        <v-chip-group>
          <v-chip
            v-for="tag in tags"
            :key="tag.text"
            :color="tag.color || 'default'"
            :variant="tag.variant || 'outlined'"
            size="small"
          >
            <v-icon v-if="tag.icon" start size="small">{{ tag.icon }}</v-icon>
            {{ tag.text }}
          </v-chip>
        </v-chip-group>
      </slot>
    </div>

    <!-- Card Actions -->
    <v-card-actions v-if="$slots.actions || actions?.length" class="mobile-card-actions" :class="actionsClasses">
      <slot name="actions">
        <template v-if="isMobile && actions?.length">
          <!-- Mobile: Show primary action prominently -->
          <v-btn
            v-if="primaryAction"
            :color="primaryAction.color || 'primary'"
            :variant="primaryAction.variant || 'elevated'"
            :size="primaryAction.size || 'default'"
            @click="handleAction(primaryAction)"
            class="flex-grow-1 mr-2"
          >
            <v-icon v-if="primaryAction.icon" start>{{ primaryAction.icon }}</v-icon>
            {{ primaryAction.text }}
          </v-btn>

          <!-- Secondary actions in menu -->
          <v-menu v-if="secondaryActions?.length" offset-y>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
              />
            </template>
            <v-list>
              <v-list-item
                v-for="action in secondaryActions"
                :key="action.text"
                @click="handleAction(action)"
              >
                <template #prepend>
                  <v-icon v-if="action.icon">{{ action.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ action.text }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <template v-else>
          <!-- Desktop: Show all actions -->
          <v-btn
            v-for="action in actions"
            :key="action.text"
            :color="action.color || 'default'"
            :variant="action.variant || 'text'"
            :size="action.size || 'default'"
            @click="handleAction(action)"
          >
            <v-icon v-if="action.icon" start>{{ action.icon }}</v-icon>
            {{ action.text }}
          </v-btn>
        </template>
      </slot>
    </v-card-actions>

    <!-- Loading Overlay -->
    <v-overlay
      :model-value="loading"
      contained
      class="card-loading-overlay"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="40"
      />
    </v-overlay>

    <!-- Touch Ripple Effect -->
    <div v-if="clickable && isMobile" class="touch-ripple" />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

interface Stat {
  label: string
  value: string | number
  color?: string
}

interface Tag {
  text: string
  color?: string
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  icon?: string
}

interface Action {
  text: string
  icon?: string
  color?: string
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  primary?: boolean
  action?: string | (() => void)
}

interface Props {
  title?: string
  subtitle?: string
  content?: string
  image?: string
  imageAlt?: string
  imageHeight?: string | number
  imageCover?: boolean
  imageOverlay?: boolean
  avatar?: boolean
  avatarIcon?: string
  avatarText?: string
  avatarColor?: string
  avatarSize?: string | number
  status?: string
  statusColor?: string
  statusVariant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  statusIcon?: string
  stats?: Stat[]
  tags?: Tag[]
  actions?: Action[]
  clickable?: boolean
  loading?: boolean
  elevation?: number
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  color?: string
  rounded?: boolean
  compact?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  content: '',
  image: '',
  imageAlt: '',
  imageHeight: 200,
  imageCover: true,
  imageOverlay: false,
  avatar: false,
  avatarIcon: '',
  avatarText: '',
  avatarColor: 'primary',
  avatarSize: 40,
  status: '',
  statusColor: 'default',
  statusVariant: 'outlined',
  statusIcon: '',
  stats: () => [],
  tags: () => [],
  actions: () => [],
  clickable: false,
  loading: false,
  elevation: 2,
  variant: 'elevated',
  color: 'surface',
  rounded: true,
  compact: false,
  fullWidth: false
})

const emit = defineEmits<{
  click: [event: Event]
  action: [action: Action]
}>()

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// Computed properties
const cardClasses = computed(() => ({
  'mobile-card--clickable': props.clickable,
  'mobile-card--compact': props.compact,
  'mobile-card--full-width': props.fullWidth,
  'mobile-card--mobile': isMobile.value,
  'mobile-card--desktop': !isMobile.value,
  'mobile-card--rounded': props.rounded
}))

const cardStyle = computed(() => ({
  cursor: props.clickable ? 'pointer' : 'default'
}))

const titleClasses = computed(() => ({
  'pa-3': isMobile.value,
  'pa-4': !isMobile.value,
  'pb-2': props.compact
}))

const contentClasses = computed(() => ({
  'pa-3': isMobile.value,
  'pa-4': !isMobile.value,
  'pt-2': props.title || props.subtitle
}))

const statsClasses = computed(() => ({
  'pa-3': isMobile.value,
  'pa-4': !isMobile.value,
  'pt-0': true
}))

const actionsClasses = computed(() => ({
  'pa-3': isMobile.value,
  'pa-4': !isMobile.value,
  'pt-2': true
}))

const primaryAction = computed(() => props.actions?.find(action => action.primary))
const secondaryActions = computed(() => props.actions?.filter(action => !action.primary))

// Methods
const handleClick = (event: Event) => {
  if (props.clickable) {
    emit('click', event)
  }
}

const handleAction = (action: Action) => {
  if (typeof action.action === 'function') {
    action.action()
  }
  emit('action', action)
}
</script>

<style scoped>
.mobile-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.mobile-card--rounded {
  border-radius: 12px;
}

.mobile-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.mobile-card--compact {
  margin-bottom: 8px;
}

.mobile-card--full-width {
  width: 100%;
}

/* Title and Content */
.mobile-card-title {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0;
  line-height: 1.2;
}

.card-content {
  line-height: 1.5;
  margin: 0;
}

.mobile-card-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Image */
.mobile-card-image {
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  align-items: flex-end;
  padding: 16px;
  color: white;
}

/* Stats */
.card-stats {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
  background: rgba(var(--v-theme-surface), 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
}

.stat-item {
  padding: 8px 4px;
}

.stat-value {
  color: rgb(var(--v-theme-primary));
}

.stat-label {
  margin-top: 2px;
}

/* Tags */
.card-tags {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
  background: rgba(var(--v-theme-surface), 0.3);
}

/* Actions */
.mobile-card-actions {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
  background: rgba(var(--v-theme-surface), 0.3);
}

/* Loading Overlay */
.card-loading-overlay {
  background: rgba(255, 255, 255, 0.8);
}

/* Touch Ripple */
.touch-ripple {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
}

.mobile-card--clickable .touch-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.mobile-card--clickable:active .touch-ripple::before {
  width: 300px;
  height: 300px;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .card-title {
    font-size: 1rem;
  }

  .card-subtitle {
    font-size: 0.8rem;
  }

  .card-content {
    font-size: 0.875rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 12px;
  }

  .stat-item {
    padding: 6px 2px;
  }

  .mobile-card-actions .v-btn {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .card-title {
    font-size: 0.95rem;
  }

  .card-subtitle {
    font-size: 0.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .header-actions .v-btn {
    min-width: 32px;
    padding: 0 8px;
  }
}

/* Dark Mode */
.v-theme--dark .mobile-card-title,
.v-theme--dark .card-stats,
.v-theme--dark .card-tags,
.v-theme--dark .mobile-card-actions {
  border-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .card-stats,
.v-theme--dark .card-tags,
.v-theme--dark .mobile-card-actions {
  background: rgba(30, 41, 59, 0.3);
}

.v-theme--dark .card-loading-overlay {
  background: rgba(15, 23, 42, 0.8);
}

/* Accessibility */
.mobile-card--clickable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-card,
  .touch-ripple::before {
    transition: none !important;
    animation: none !important;
  }

  .mobile-card--clickable:hover {
    transform: none;
  }
}
</style>