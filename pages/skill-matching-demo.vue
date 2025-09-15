<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-brain" class="mr-3" color="primary" />
            <span>Skill Matching & Recommendation Engine Demo</span>
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              This demo showcases the intelligent skill-based matching system for connecting participants based on:
            </p>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon icon="mdi-puzzle" color="primary" size="large" class="mb-2" />
                  <h4 class="text-h6 mb-2">Complementary Skills</h4>
                  <p class="text-body-2">Matches people who have skills others need, creating valuable learning and collaboration opportunities.</p>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon icon="mdi-account-group" color="success" size="large" class="mb-2" />
                  <h4 class="text-h6 mb-2">Shared Interests</h4>
                  <p class="text-body-2">Connects people with similar expertise and interests for knowledge exchange and networking.</p>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4">
                  <v-icon icon="mdi-school" color="orange" size="large" class="mb-2" />
                  <h4 class="text-h6 mb-2">Mentorship</h4>
                  <p class="text-body-2">Identifies teaching and learning opportunities between participants with different experience levels.</p>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <!-- Demo Component -->
        <PeopleYouShouldMeet
          :event-id="demoEventId"
          :auto-refresh="false"
        />
      </v-col>

      <v-col cols="12" class="mt-6">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-cog" class="mr-2" />
            Algorithm Details
          </v-card-title>
          <v-card-text>
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon icon="mdi-function" class="mr-2" />
                  Skill Normalization & Taxonomy
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="mb-3">The system normalizes skills to handle variations and common abbreviations:</p>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h5 class="text-subtitle-1 mb-2">Programming Languages:</h5>
                      <ul class="text-body-2">
                        <li><code>js</code>, <code>javascript</code> → <strong>JavaScript</strong></li>
                        <li><code>py</code>, <code>python</code> → <strong>Python</strong></li>
                        <li><code>ts</code>, <code>typescript</code> → <strong>TypeScript</strong></li>
                      </ul>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h5 class="text-subtitle-1 mb-2">Frameworks & Tools:</h5>
                      <ul class="text-body-2">
                        <li><code>reactjs</code>, <code>react.js</code> → <strong>React</strong></li>
                        <li><code>vuejs</code>, <code>vue.js</code> → <strong>Vue</strong></li>
                        <li><code>nodejs</code>, <code>node.js</code> → <strong>Node.js</strong></li>
                      </ul>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon icon="mdi-calculator" class="mr-2" />
                  Compatibility Scoring Algorithm
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="mb-3">Compatibility scores are calculated using weighted factors:</p>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h5 class="text-subtitle-1 mb-2">Mentorship Matching:</h5>
                      <ul class="text-body-2">
                        <li>Complementarity: <strong>70%</strong></li>
                        <li>Skill Overlap: <strong>20%</strong></li>
                        <li>Interest Similarity: <strong>10%</strong></li>
                      </ul>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h5 class="text-subtitle-1 mb-2">Complementary Skills:</h5>
                      <ul class="text-body-2">
                        <li>Complementarity: <strong>60%</strong></li>
                        <li>Skill Overlap: <strong>30%</strong></li>
                        <li>Interest Similarity: <strong>10%</strong></li>
                      </ul>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon icon="mdi-api" class="mr-2" />
                  API Endpoints
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <h5 class="text-subtitle-1 mb-3">Available API endpoints for skill matching:</h5>
                  <v-row>
                    <v-col cols="12">
                      <v-card variant="outlined" class="pa-3 mb-3">
                        <code class="text-primary">GET /api/events/{eventId}/recommendations/people</code>
                        <p class="text-body-2 mt-2">Returns personalized recommendations based on user's skills and interests</p>
                        <div class="mt-2">
                          <v-chip size="small" color="info" class="mr-1">includeComplementary</v-chip>
                          <v-chip size="small" color="info" class="mr-1">includeSharedInterests</v-chip>
                          <v-chip size="small" color="info" class="mr-1">includeMentorship</v-chip>
                          <v-chip size="small" color="info">minScore</v-chip>
                        </div>
                      </v-card>

                      <v-card variant="outlined" class="pa-3 mb-3">
                        <code class="text-primary">POST /api/events/{eventId}/introductions/request</code>
                        <p class="text-body-2 mt-2">Create an introduction request to connect with another participant</p>
                      </v-card>

                      <v-card variant="outlined" class="pa-3">
                        <code class="text-primary">POST /api/events/{eventId}/introductions/{id}/respond</code>
                        <p class="text-body-2 mt-2">Accept or decline an introduction request</p>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// Demo setup
const demoEventId = 'demo-event-123'

// Set page title
useHead({
  title: 'Skill Matching Demo - Unconference Platform'
})

definePageMeta({
  requiresAuth: false  // Make this publicly accessible for demo
})
</script>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}
</style>