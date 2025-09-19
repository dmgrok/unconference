<template>
  <div class="feedback-widget">
    <!-- Floating feedback button -->
    <v-btn
      icon
      color="primary"
      size="small"
      class="feedback-btn"
      @click="showFeedback = true"
      title="Give Feedback"
    >
      <v-icon>mdi-comment-outline</v-icon>
    </v-btn>

    <!-- Feedback modal -->
    <v-dialog v-model="showFeedback" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
          Quick Feedback
        </v-card-title>

        <v-card-text>
          <v-textarea
            v-model="feedbackText"
            label="What can we improve? What's missing? What's confusing?"
            placeholder="Be honest! This helps us make the platform better."
            rows="4"
            counter
            maxlength="500"
          />

          <v-select
            v-model="feedbackType"
            :items="feedbackTypes"
            label="Type of feedback"
            density="compact"
          />

          <!-- Optional contact info -->
          <v-text-field
            v-model="contactEmail"
            label="Email (optional - for follow-up)"
            type="email"
            density="compact"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showFeedback = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submitFeedback"
            :loading="submitting"
            :disabled="!feedbackText.trim()"
          >
            Send Feedback
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success snackbar -->
    <v-snackbar v-model="showSuccess" timeout="3000" color="success">
      Thanks for your feedback! We read every message.
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
const showFeedback = ref(false);
const feedbackText = ref('');
const feedbackType = ref('suggestion');
const contactEmail = ref('');
const submitting = ref(false);
const showSuccess = ref(false);

const feedbackTypes = [
  { title: 'Suggestion', value: 'suggestion' },
  { title: 'Bug Report', value: 'bug' },
  { title: 'Missing Feature', value: 'feature' },
  { title: 'Confusing UI', value: 'ux' },
  { title: 'Other', value: 'other' }
];

const submitFeedback = async () => {
  if (!feedbackText.value.trim()) return;

  submitting.value = true;

  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        text: feedbackText.value,
        type: feedbackType.value,
        email: contactEmail.value || null,
        page: useRoute().path,
        timestamp: new Date().toISOString()
      }
    });

    // Reset form
    feedbackText.value = '';
    contactEmail.value = '';
    feedbackType.value = 'suggestion';
    showFeedback.value = false;
    showSuccess.value = true;

  } catch (error) {
    console.error('Feedback submission failed:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.feedback-btn {
  position: fixed !important;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@media (max-width: 600px) {
  .feedback-btn {
    bottom: 80px; /* Above mobile browser bars */
    right: 16px;
  }
}
</style>