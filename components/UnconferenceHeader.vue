<script setup lang="ts">
const { eventConfig } = useEventConfig()
</script>

<template>
  <v-container class="text-center py-16">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <!-- Platform Branding -->
        <div class="mb-8">
          <h1 class="text-h1 font-weight-bold mb-4 text-primary">Unconference Platform</h1>
          <p class="text-h5 text-grey-darken-1 mb-2">
            Join collaborative discussions and shape the agenda together
          </p>
          <p class="text-body-1 text-grey">
            Enter your event code to participate in any unconference worldwide
          </p>
        </div>

        <!-- What is an Unconference? -->
        <v-card class="mx-auto pa-6 mb-6" max-width="900" elevation="2" color="primary" variant="tonal">
          <v-card-title class="text-h5 mb-4">
            <v-icon class="mr-2">mdi-help-circle</v-icon>
            What is an Unconference?
          </v-card-title>
          <v-card-text class="text-left">
            <p class="text-body-1 mb-3">
              An <strong>unconference</strong> is a participant-driven event where <em>you</em> shape the agenda! 
              Instead of predetermined speakers, attendees propose discussion topics, vote on what interests them most, 
              and participate in focused small-group conversations.
            </p>
            <div class="d-flex flex-wrap justify-center gap-4 mt-4">
              <v-chip color="success" variant="outlined" prepend-icon="mdi-lightbulb">
                Propose Topics
              </v-chip>
              <v-chip color="info" variant="outlined" prepend-icon="mdi-vote">
                Vote on Interests
              </v-chip>
              <v-chip color="warning" variant="outlined" prepend-icon="mdi-account-group">
                Join Discussions
              </v-chip>
              <v-chip color="purple" variant="outlined" prepend-icon="mdi-share-variant">
                Share Knowledge
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- How to Join -->
        <v-card class="mx-auto pa-6 mb-8" max-width="900" elevation="2" variant="outlined">
          <v-card-title class="text-h5 mb-4">
            <v-icon class="mr-2">mdi-rocket-launch</v-icon>
            How to Join Any Event
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" class="text-center">
                <v-icon size="64" color="primary" class="mb-3">mdi-qrcode</v-icon>
                <h3 class="mb-2">Scan QR Code</h3>
                <p class="text-body-2">
                  At the event venue, look for QR codes on screens or posters
                </p>
              </v-col>
              <v-col cols="12" md="4" class="text-center">
                <v-icon size="64" color="secondary" class="mb-3">mdi-ticket-confirmation</v-icon>
                <h3 class="mb-2">Enter Event Code</h3>
                <p class="text-body-2">
                  Use the event code provided by organizers (e.g., "DEMO2024")
                </p>
              </v-col>
              <v-col cols="12" md="4" class="text-center">
                <v-icon size="64" color="success" class="mb-3">mdi-web</v-icon>
                <h3 class="mb-2">Follow Link</h3>
                <p class="text-body-2">
                  Click invitation links shared by event organizers
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Action Buttons -->
        <div class="d-flex flex-column align-center gap-4">
          <v-btn
            color="primary"
            size="x-large"
            to="/quick-join"
            class="text-h6 px-8"
            prepend-icon="mdi-rocket-launch"
          >
            Join an Event
          </v-btn>

          <div class="text-center">
            <p class="text-body-2 text-grey mb-2">Already participating or have an account?</p>
            <v-btn
              color="grey"
              variant="text"
              to="/login"
              prepend-icon="mdi-login"
            >
              Sign In
            </v-btn>
          </div>
        </div>

        <!-- Demo Event Info (if applicable) -->
        <v-card v-if="eventConfig.title !== 'Unconference Platform'" class="mx-auto pa-4 mt-8" max-width="600" elevation="1" color="info" variant="tonal">
          <v-card-title class="text-h6">
            <v-icon class="mr-2">mdi-star</v-icon>
            Currently Featured Event
          </v-card-title>
          <v-card-text>
            <h3 class="mb-2">{{ eventConfig.title }}</h3>
            <p class="mb-2">{{ eventConfig.description }}</p>
            <div class="d-flex align-center gap-4 text-body-2">
              <span><v-icon size="small" class="mr-1">mdi-calendar</v-icon>{{ eventConfig.dates }}</span>
              <span><v-icon size="small" class="mr-1">mdi-map-marker</v-icon>{{ eventConfig.location }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
