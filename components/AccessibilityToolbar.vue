<template>
  <div class="accessibility-toolbar" :class="{ 'toolbar--expanded': isExpanded }">
    <button
      class="toolbar-toggle"
      @click="toggleToolbar"
      :aria-expanded="isExpanded"
      aria-label="Toggle accessibility options"
      aria-describedby="a11y-toolbar-desc"
    >
      <v-icon>mdi-human-handsup</v-icon>
      <span class="toggle-text">{{ isExpanded ? 'Hide' : 'Accessibility' }}</span>
    </button>

    <div id="a11y-toolbar-desc" class="sr-only">
      Accessibility toolbar with options for high contrast, font size, and reduced motion
    </div>

    <div v-if="isExpanded" class="toolbar-content" role="region" aria-labelledby="a11y-toolbar-title">
      <h2 id="a11y-toolbar-title" class="toolbar-title">Accessibility Options</h2>

      <div class="toolbar-group">
        <h3 class="group-title">Visual</h3>

        <button
          class="toolbar-button"
          @click="toggleHighContrast"
          :class="{ active: isHighContrast }"
          :aria-pressed="isHighContrast"
          aria-describedby="contrast-desc"
        >
          <v-icon>mdi-contrast-box</v-icon>
          <span>High Contrast</span>
        </button>
        <div id="contrast-desc" class="sr-only">
          Toggle high contrast mode for better visibility
        </div>

        <div class="font-size-group">
          <label for="font-size-select" class="group-label">Font Size</label>
          <select
            id="font-size-select"
            :value="fontSize"
            @change="handleFontSizeChange"
            class="font-size-select"
            aria-describedby="font-size-desc"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="x-large">Extra Large</option>
          </select>
          <div id="font-size-desc" class="sr-only">
            Adjust the font size throughout the application
          </div>
        </div>
      </div>

      <div class="toolbar-group">
        <h3 class="group-title">Motion</h3>

        <div class="motion-info">
          <v-icon
            :color="isMotionReduced ? 'success' : 'grey'"
            class="motion-icon"
            aria-hidden="true"
          >
            {{ isMotionReduced ? 'mdi-check-circle' : 'mdi-information' }}
          </v-icon>
          <span class="motion-text">
            {{ isMotionReduced ? 'Reduced motion detected' : 'Normal motion enabled' }}
          </span>
          <div class="motion-description">
            Motion preferences are set by your system settings
          </div>
        </div>
      </div>

      <div class="toolbar-group">
        <h3 class="group-title">Navigation</h3>

        <button
          class="toolbar-button"
          @click="showKeyboardShortcuts"
          aria-describedby="shortcuts-desc"
        >
          <v-icon>mdi-keyboard</v-icon>
          <span>Keyboard Shortcuts</span>
        </button>
        <div id="shortcuts-desc" class="sr-only">
          View available keyboard shortcuts for navigation
        </div>

        <button
          class="toolbar-button"
          @click="skipToMain"
          aria-describedby="skip-desc"
        >
          <v-icon>mdi-skip-next</v-icon>
          <span>Skip to Main</span>
        </button>
        <div id="skip-desc" class="sr-only">
          Jump directly to the main content area
        </div>
      </div>

      <div class="toolbar-footer">
        <p class="footer-text">
          Need more help?
          <a href="mailto:accessibility@unconference.app" class="footer-link">
            Contact our accessibility team
          </a>
        </p>
      </div>
    </div>

    <!-- Keyboard shortcuts modal -->
    <v-dialog v-model="showShortcuts" max-width="600" persistent>
      <v-card role="dialog" aria-labelledby="shortcuts-modal-title" aria-modal="true">
        <v-card-title id="shortcuts-modal-title">
          <v-icon class="mr-2">mdi-keyboard</v-icon>
          Keyboard Shortcuts
        </v-card-title>

        <v-card-text>
          <div class="shortcuts-grid">
            <div class="shortcut-group">
              <h4>Navigation</h4>
              <dl class="shortcut-list">
                <dt>Tab</dt>
                <dd>Move to next interactive element</dd>
                <dt>Shift + Tab</dt>
                <dd>Move to previous interactive element</dd>
                <dt>Enter / Space</dt>
                <dd>Activate buttons and links</dd>
                <dt>Escape</dt>
                <dd>Close dialogs and menus</dd>
              </dl>
            </div>

            <div class="shortcut-group">
              <h4>Topic Cards</h4>
              <dl class="shortcut-list">
                <dt>Arrow Keys</dt>
                <dd>Navigate between topic cards</dd>
                <dt>Enter</dt>
                <dd>Select/vote for topic</dd>
                <dt>Space</dt>
                <dd>Toggle topic details</dd>
              </dl>
            </div>

            <div class="shortcut-group">
              <h4>Forms</h4>
              <dl class="shortcut-list">
                <dt>Tab</dt>
                <dd>Move between form fields</dd>
                <dt>Enter</dt>
                <dd>Submit form</dd>
                <dt>Escape</dt>
                <dd>Cancel form editing</dd>
              </dl>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showShortcuts = false" color="primary">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
const {
  isHighContrast,
  isMotionReduced,
  fontSize,
  initializeAccessibilitySettings,
  toggleHighContrast,
  setFontSize,
  announceTtoScreenReader,
  focusElement
} = useAccessibility()

const isExpanded = ref(false)
const showShortcuts = ref(false)

const toggleToolbar = () => {
  isExpanded.value = !isExpanded.value

  if (isExpanded.value) {
    announceTtoScreenReader('Accessibility toolbar opened')
    // Focus the first button in the toolbar
    nextTick(() => {
      focusElement('.toolbar-content .toolbar-button', 100)
    })
  } else {
    announceTtoScreenReader('Accessibility toolbar closed')
  }
}

const handleFontSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  setFontSize(target.value)
  announceTtoScreenReader(`Font size changed to ${target.value}`)
}

const showKeyboardShortcuts = () => {
  showShortcuts.value = true
  announceTtoScreenReader('Keyboard shortcuts dialog opened')
}

const skipToMain = () => {
  const main = document.querySelector('main') || document.querySelector('[role="main"]')
  if (main) {
    (main as HTMLElement).focus()
    announceTtoScreenReader('Skipped to main content')
  }
}

// Handle Escape key to close toolbar
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isExpanded.value) {
    isExpanded.value = false
    announceTtoScreenReader('Accessibility toolbar closed')
    focusElement('.toolbar-toggle')
  }
}

onMounted(() => {
  initializeAccessibilitySettings()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.accessibility-toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  font-family: system-ui, -apple-system, sans-serif;
}

.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #6366F1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.2s ease;
}

.toolbar-toggle:hover {
  background: #5855E8;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.toolbar-toggle:focus {
  outline: 2px solid #FFFF00;
  outline-offset: 2px;
}

.toggle-text {
  min-width: 80px;
  text-align: left;
}

.toolbar-content {
  position: absolute;
  top: 60px;
  right: 0;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 20px;
  min-width: 300px;
  max-width: 400px;
}

.toolbar-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
}

.toolbar-group {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
}

.toolbar-group:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.toolbar-button:hover {
  background: #F8FAFC;
  border-color: #6366F1;
}

.toolbar-button:focus {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.toolbar-button.active {
  background: #EEF2FF;
  border-color: #6366F1;
  color: #6366F1;
}

.font-size-group {
  margin-top: 8px;
}

.font-size-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
}

.font-size-select:focus {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
  border-color: #6366F1;
}

.motion-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}

.motion-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.motion-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
}

.motion-description {
  font-size: 12px;
  color: #64748B;
  margin-top: 4px;
  line-height: 1.4;
}

.toolbar-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F1F5F9;
}

.footer-text {
  margin: 0;
  font-size: 12px;
  color: #64748B;
  line-height: 1.4;
}

.footer-link {
  color: #6366F1;
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-link:focus {
  outline: 2px solid #6366F1;
  outline-offset: 1px;
}

/* Shortcuts Modal */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.shortcut-group h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.shortcut-list {
  margin: 0;
}

.shortcut-list dt {
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  font-family: monospace;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  font-size: 12px;
}

.shortcut-list dd {
  margin: 0 0 12px 0;
  color: #64748B;
  font-size: 14px;
  line-height: 1.4;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Dark mode support */
.v-theme--dark .toolbar-content {
  background: #1E293B;
  border-color: #475569;
}

.v-theme--dark .toolbar-title {
  color: #F1F5F9;
}

.v-theme--dark .group-title {
  color: #94A3B8;
}

.v-theme--dark .group-label {
  color: #CBD5E1;
}

.v-theme--dark .toolbar-button {
  color: #CBD5E1;
  border-color: #475569;
}

.v-theme--dark .toolbar-button:hover {
  background: #334155;
}

.v-theme--dark .motion-info {
  background: #334155;
  border-color: #475569;
}

.v-theme--dark .motion-text {
  color: #CBD5E1;
}

.v-theme--dark .font-size-select {
  background: #334155;
  border-color: #475569;
  color: #CBD5E1;
}

/* High contrast mode support */
.high-contrast .toolbar-toggle {
  background: #FFFF00 !important;
  color: #000000 !important;
  border: 2px solid #000000 !important;
}

.high-contrast .toolbar-content {
  background: #000000 !important;
  color: #FFFFFF !important;
  border: 2px solid #FFFFFF !important;
}

.high-contrast .toolbar-button {
  background: #000000 !important;
  color: #FFFFFF !important;
  border: 2px solid #FFFFFF !important;
}

.high-contrast .toolbar-button:hover,
.high-contrast .toolbar-button.active {
  background: #FFFFFF !important;
  color: #000000 !important;
}

/* Responsive design */
@media (max-width: 768px) {
  .accessibility-toolbar {
    position: fixed;
    top: 10px;
    right: 10px;
  }

  .toolbar-content {
    width: calc(100vw - 40px);
    max-width: none;
    right: -10px;
  }

  .shortcuts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>