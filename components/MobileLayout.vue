<template>
  <div class="mobile-layout" :class="layoutClasses">
    <!-- Mobile Header -->
    <div v-if="showHeader && isMobile" class="mobile-header">
      <v-app-bar
        :elevation="headerElevation"
        :color="headerColor"
        :height="headerHeight"
        flat
        class="mobile-app-bar"
      >
        <v-container class="d-flex align-center pa-2">
          <!-- Back Button -->
          <v-btn
            v-if="showBackButton"
            icon="mdi-arrow-left"
            size="large"
            color="primary"
            variant="text"
            @click="goBack"
            class="mr-2"
          />

          <!-- Menu Button -->
          <v-btn
            v-else-if="showMenuButton"
            icon="mdi-menu"
            size="large"
            color="primary"
            variant="text"
            @click="$emit('toggle-menu')"
            class="mr-2"
          />

          <!-- Title Section -->
          <div class="title-section flex-grow-1">
            <h1 v-if="title" class="mobile-title text-truncate">{{ title }}</h1>
            <p v-if="subtitle" class="mobile-subtitle text-truncate">{{ subtitle }}</p>
          </div>

          <!-- Header Actions -->
          <div v-if="$slots.headerActions" class="header-actions">
            <slot name="headerActions" />
          </div>
        </v-container>
      </v-app-bar>
    </div>

    <!-- Main Content Area -->
    <v-main class="mobile-main" :class="mainClasses">
      <v-container
        :fluid="fluidContainer"
        :class="containerClasses"
        class="mobile-container"
      >
        <!-- Page Header (for desktop/tablet) -->
        <div v-if="showPageHeader && !isMobile" class="page-header mb-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">{{ title }}</h1>
              <p v-if="subtitle" class="text-subtitle-1 text-grey">{{ subtitle }}</p>
            </div>
            <div v-if="$slots.pageActions">
              <slot name="pageActions" />
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div v-if="$slots.statusBar" class="status-bar mb-4">
          <slot name="statusBar" />
        </div>

        <!-- Quick Actions (Mobile) -->
        <div v-if="$slots.quickActions && isMobile" class="quick-actions-mobile mb-4">
          <slot name="quickActions" />
        </div>

        <!-- Main Content -->
        <div class="main-content" :class="contentClasses">
          <slot />
        </div>

        <!-- Floating Action Button -->
        <v-fab
          v-if="showFab && fabIcon"
          :icon="fabIcon"
          :color="fabColor"
          :size="fabSize"
          :location="fabLocation"
          @click="$emit('fab-click')"
          class="mobile-fab"
          :class="{ 'mb-16': showBottomNav && isMobile }"
        />
      </v-container>
    </v-main>

    <!-- Bottom Navigation Spacer -->
    <div v-if="showBottomNav && isMobile" class="bottom-nav-spacer" />

    <!-- Loading Overlay -->
    <v-overlay
      :model-value="loading"
      contained
      class="mobile-loading-overlay"
    >
      <div class="text-center">
        <v-progress-circular
          :size="60"
          :width="6"
          color="primary"
          indeterminate
        />
        <p v-if="loadingText" class="mt-4 text-body-1">{{ loadingText }}</p>
      </div>
    </v-overlay>

    <!-- Pull-to-refresh indicator -->
    <div
      v-if="enablePullToRefresh && isMobile"
      ref="pullToRefreshIndicator"
      class="pull-to-refresh-indicator"
      :class="{ 'active': isPulling }"
    >
      <v-icon :class="{ 'spinning': isRefreshing }" color="primary">
        {{ isRefreshing ? 'mdi-loading' : 'mdi-arrow-down' }}
      </v-icon>
      <span class="ml-2">{{ pullToRefreshText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  subtitle?: string
  showHeader?: boolean
  showBackButton?: boolean
  showMenuButton?: boolean
  showPageHeader?: boolean
  showBottomNav?: boolean
  showFab?: boolean
  fabIcon?: string
  fabColor?: string
  fabSize?: 'small' | 'default' | 'large' | 'x-large'
  fabLocation?: string
  headerColor?: string
  headerHeight?: number
  headerElevation?: number
  fluidContainer?: boolean
  loading?: boolean
  loadingText?: string
  enablePullToRefresh?: boolean
  contentPadding?: 'none' | 'small' | 'default' | 'large'
  layoutMode?: 'default' | 'card' | 'list' | 'grid'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  showHeader: true,
  showBackButton: false,
  showMenuButton: true,
  showPageHeader: true,
  showBottomNav: false,
  showFab: false,
  fabIcon: '',
  fabColor: 'primary',
  fabSize: 'default',
  fabLocation: 'bottom end',
  headerColor: 'surface',
  headerHeight: 64,
  headerElevation: 2,
  fluidContainer: false,
  loading: false,
  loadingText: '',
  enablePullToRefresh: false,
  contentPadding: 'default',
  layoutMode: 'default'
})

const emit = defineEmits<{
  'toggle-menu': []
  'fab-click': []
  'pull-to-refresh': []
  'back': []
}>()

const { mobile } = useDisplay()
const router = useRouter()

// Reactive state
const pullToRefreshIndicator = ref<HTMLElement>()
const isPulling = ref(false)
const isRefreshing = ref(false)
const pullStartY = ref(0)
const pullCurrentY = ref(0)

// Computed properties
const isMobile = computed(() => mobile.value)

const layoutClasses = computed(() => ({
  'mobile-layout--mobile': isMobile.value,
  'mobile-layout--desktop': !isMobile.value,
  [`mobile-layout--${props.layoutMode}`]: true
}))

const mainClasses = computed(() => ({
  'mobile-main--with-header': props.showHeader && isMobile.value,
  'mobile-main--with-bottom-nav': props.showBottomNav && isMobile.value
}))

const containerClasses = computed(() => ({
  [`pa-${getPaddingClass()}`]: true
}))

const contentClasses = computed(() => ({
  'content--card': props.layoutMode === 'card',
  'content--list': props.layoutMode === 'list',
  'content--grid': props.layoutMode === 'grid'
}))

const pullToRefreshText = computed(() => {
  if (isRefreshing.value) return 'Refreshing...'
  if (isPulling.value) return 'Release to refresh'
  return 'Pull to refresh'
})

// Methods
const getPaddingClass = () => {
  if (isMobile.value) {
    switch (props.contentPadding) {
      case 'none': return '0'
      case 'small': return '2'
      case 'large': return '6'
      default: return '3'
    }
  } else {
    switch (props.contentPadding) {
      case 'none': return '0'
      case 'small': return '4'
      case 'large': return '8'
      default: return '6'
    }
  }
}

const goBack = () => {
  emit('back')
  if (router.back) {
    router.back()
  } else {
    router.push('/')
  }
}

// Pull to refresh functionality
const handleTouchStart = (event: TouchEvent) => {
  if (!props.enablePullToRefresh || !isMobile.value) return

  pullStartY.value = event.touches[0].clientY
  pullCurrentY.value = event.touches[0].clientY
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.enablePullToRefresh || !isMobile.value) return

  pullCurrentY.value = event.touches[0].clientY
  const pullDistance = pullCurrentY.value - pullStartY.value

  // Only trigger when at top of page and pulling down
  if (window.scrollY === 0 && pullDistance > 0) {
    isPulling.value = pullDistance > 80

    if (pullToRefreshIndicator.value) {
      pullToRefreshIndicator.value.style.transform = `translateY(${Math.min(pullDistance / 2, 50)}px)`
      pullToRefreshIndicator.value.style.opacity = String(Math.min(pullDistance / 80, 1))
    }
  }
}

const handleTouchEnd = () => {
  if (!props.enablePullToRefresh || !isMobile.value) return

  if (isPulling.value && !isRefreshing.value) {
    isRefreshing.value = true
    emit('pull-to-refresh')

    // Reset after 2 seconds (you should call finishRefresh() from parent)
    setTimeout(() => {
      finishRefresh()
    }, 2000)
  } else {
    resetPullToRefresh()
  }
}

const resetPullToRefresh = () => {
  isPulling.value = false

  if (pullToRefreshIndicator.value) {
    pullToRefreshIndicator.value.style.transform = 'translateY(-100%)'
    pullToRefreshIndicator.value.style.opacity = '0'
  }
}

const finishRefresh = () => {
  isRefreshing.value = false
  resetPullToRefresh()
}

// Expose methods for parent components
defineExpose({
  finishRefresh
})

// Lifecycle
onMounted(() => {
  if (props.enablePullToRefresh && isMobile.value) {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (props.enablePullToRefresh && isMobile.value) {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Mobile Header */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.mobile-app-bar {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.title-section {
  min-width: 0; /* Allows text truncation */
}

.mobile-title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.mobile-subtitle {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
  line-height: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Main Content */
.mobile-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.mobile-main--with-header {
  padding-top: 64px;
}

.mobile-main--with-bottom-nav {
  padding-bottom: 70px;
}

.mobile-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.status-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px;
  margin: 0 -12px 16px;
}

.quick-actions-mobile {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  padding: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.main-content {
  flex-grow: 1;
}

/* Content Layout Modes */
.content--card .v-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.content--list {
  padding: 0;
}

.content--list .v-list-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.content--grid {
  display: grid;
  gap: 16px;
}

@media (max-width: 768px) {
  .content--grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) {
  .content--grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

/* Floating Action Button */
.mobile-fab {
  position: fixed !important;
  z-index: 1001;
}

.mobile-fab.mb-16 {
  margin-bottom: 86px !important;
}

/* Bottom Navigation Spacer */
.bottom-nav-spacer {
  height: 70px;
  flex-shrink: 0;
}

/* Loading Overlay */
.mobile-loading-overlay {
  background: rgba(0, 0, 0, 0.3);
}

/* Pull to Refresh */
.pull-to-refresh-indicator {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 0 0 20px 20px;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
  border-top: none;
  z-index: 1002;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  opacity: 0;
}

.pull-to-refresh-indicator.active {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.pull-to-refresh-indicator .v-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Dark Mode */
.v-theme--dark .mobile-app-bar {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .status-bar {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .quick-actions-mobile {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .pull-to-refresh-indicator {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.2);
}

/* Touch Feedback */
@media (hover: none) and (pointer: coarse) {
  .mobile-fab:active {
    transform: scale(0.95);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .mobile-app-bar,
  .status-bar,
  .pull-to-refresh-indicator,
  .mobile-fab {
    transition: none !important;
    animation: none !important;
  }
}

/* Layout Variants */
.mobile-layout--mobile .main-content {
  padding: 0;
}

.mobile-layout--desktop .main-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsive Grid Adjustments */
@media (max-width: 480px) {
  .mobile-title {
    font-size: 1rem;
  }

  .mobile-subtitle {
    font-size: 0.7rem;
  }

  .header-actions .v-btn {
    min-width: 32px;
    padding: 0 8px;
  }

  .quick-actions-mobile {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
}
</style>