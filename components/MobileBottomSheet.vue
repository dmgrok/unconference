<template>
  <v-bottom-sheet
    v-model="isOpen"
    :inset="inset"
    :persistent="persistent"
    :max-width="maxWidth"
    :height="height"
    :class="[`mobile-bottom-sheet--${variant}`, customClass]"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="bottom-sheet-card" :class="cardClass">
      <!-- Handle bar for gesture indication -->
      <div class="handle-bar" />

      <!-- Header -->
      <v-card-title v-if="title || $slots.title" class="bottom-sheet-header">
        <slot name="title">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon v-if="icon" :color="iconColor" class="mr-2">{{ icon }}</v-icon>
              <span class="text-h6">{{ title }}</span>
            </div>
            <v-btn
              v-if="closable"
              icon="mdi-close"
              size="small"
              variant="text"
              @click="close"
            />
          </div>
        </slot>
      </v-card-title>

      <!-- Content -->
      <v-card-text class="bottom-sheet-content" :class="contentClass">
        <slot />
      </v-card-text>

      <!-- Actions -->
      <v-card-actions v-if="$slots.actions" class="bottom-sheet-actions">
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  icon?: string
  iconColor?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  inset?: boolean
  persistent?: boolean
  closable?: boolean
  maxWidth?: string | number
  height?: string | number
  customClass?: string
  cardClass?: string
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  iconColor: 'primary',
  variant: 'default',
  inset: true,
  persistent: false,
  closable: true,
  maxWidth: 500,
  height: 'auto',
  customClass: '',
  cardClass: '',
  contentClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  emit('close')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.mobile-bottom-sheet--default .bottom-sheet-card {
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.mobile-bottom-sheet--success .bottom-sheet-card {
  border-radius: 20px 20px 0 0;
  border-top: 4px solid rgb(var(--v-theme-success));
}

.mobile-bottom-sheet--warning .bottom-sheet-card {
  border-radius: 20px 20px 0 0;
  border-top: 4px solid rgb(var(--v-theme-warning));
}

.mobile-bottom-sheet--error .bottom-sheet-card {
  border-radius: 20px 20px 0 0;
  border-top: 4px solid rgb(var(--v-theme-error));
}

.mobile-bottom-sheet--info .bottom-sheet-card {
  border-radius: 20px 20px 0 0;
  border-top: 4px solid rgb(var(--v-theme-info));
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 2px;
  margin: 12px auto 8px;
  cursor: grab;
  transition: all 0.3s ease;
}

.handle-bar:hover {
  background: rgba(var(--v-theme-on-surface), 0.5);
  width: 50px;
}

.bottom-sheet-header {
  padding: 16px 20px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.bottom-sheet-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 120px);
}

.bottom-sheet-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
  background: rgba(var(--v-theme-surface), 0.5);
}

/* Smooth animations */
.v-bottom-sheet .v-overlay__content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Touch feedback */
@media (hover: none) and (pointer: coarse) {
  .handle-bar:active {
    transform: scaleY(1.5);
  }
}
</style>