<template>
  <v-container>
    <v-card class="personal-recap-card" elevation="10">
      <!-- Header with gradient background -->
      <v-card-title class="recap-header">
        <div class="header-content">
          <h1 class="white--text display-1 font-weight-bold">
            🎉 Your Event Impact Recap
          </h1>
          <p class="white--text subtitle-1 mt-2">
            {{ event?.title }} - {{ formatDate(event?.date) }}
          </p>
          
          <!-- View Mode Selector -->
          <div class="view-selector mt-4">
            <v-btn-toggle v-model="viewMode" mandatory class="view-toggle">
              <v-btn value="professional" class="view-btn">
                <v-icon left>mdi-briefcase</v-icon>
                Professional
              </v-btn>
              <v-btn value="personal" class="view-btn">
                <v-icon left>mdi-account</v-icon>
                Personal
              </v-btn>
              <v-btn value="summary" class="view-btn">
                <v-icon left>mdi-lightning-bolt</v-icon>
                Quick Summary
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </v-card-title>

      <!-- Quick Stats Overview -->
      <v-card-text class="pa-6">
        <!-- Executive Summary (Professional & Summary Views) -->
        <v-row v-if="viewMode === 'professional' || viewMode === 'summary'" class="mb-6">
          <v-col cols="12">
            <v-card class="executive-summary-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold primary white--text">
                <v-icon left color="white">mdi-chart-line</v-icon>
                Executive Summary
                <v-spacer />
                <v-btn 
                  color="white" 
                  text 
                  small
                  @click="shareExecutiveSummary"
                >
                  <v-icon small left>mdi-share</v-icon>
                  Share
                </v-btn>
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div class="summary-content">
                  <h3 class="text-h6 font-weight-bold mb-3">Event ROI & Key Outcomes</h3>
                  
                  <!-- Key Metrics Row -->
                  <v-row class="mb-4">
                    <v-col cols="6" md="3" class="text-center">
                      <div class="metric-card">
                        <div class="text-h4 font-weight-bold primary--text">{{ followUpCommitments?.length || 0 }}</div>
                        <div class="text-caption">Active Projects</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3" class="text-center">
                      <div class="metric-card">
                        <div class="text-h4 font-weight-bold success--text">{{ (connections?.length || 0) }}</div>
                        <div class="text-caption">New Connections</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3" class="text-center">
                      <div class="metric-card">
                        <div class="text-h4 font-weight-bold warning--text">{{ generatedIdeas?.length || 0 }}</div>
                        <div class="text-caption">Ideas Generated</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3" class="text-center">
                      <div class="metric-card">
                        <div class="text-h4 font-weight-bold info--text">{{ journey?.activeMinutes || 0 }}min</div>
                        <div class="text-caption">Active Participation</div>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Business Impact Statement -->
                  <v-alert type="info" class="mb-4" outlined>
                    <div class="font-weight-bold">Business Impact:</div>
                    <div>Generated {{ generatedIdeas?.length || 0 }} actionable ideas, initiated {{ followUpCommitments?.length || 0 }} follow-up projects, and established {{ connections?.length || 0 }} strategic connections that could drive innovation and collaboration opportunities.</div>
                  </v-alert>

                  <!-- Top 3 Outcomes (Summary View) -->
                  <div v-if="viewMode === 'summary'">
                    <h4 class="text-subtitle-1 font-weight-bold mb-3">Top 3 Outcomes:</h4>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="success">mdi-check-circle</v-icon>
                        </template>
                        <v-list-item-title>{{ getTopOutcome(1) }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="success">mdi-check-circle</v-icon>
                        </template>
                        <v-list-item-title>{{ getTopOutcome(2) }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="success">mdi-check-circle</v-icon>
                        </template>
                        <v-list-item-title>{{ getTopOutcome(3) }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Strategic Connections Section (Professional & Summary Views) -->
        <v-row v-if="viewMode === 'professional' || viewMode === 'summary'" class="mb-6">
          <v-col cols="12">
            <v-card class="strategic-connections-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold success white--text">
                <v-icon left color="white">mdi-account-network</v-icon>
                Strategic Connections
                <v-spacer />
                <v-btn
                  color="white"
                  text
                  small
                  @click="viewAllConnections"
                >
                  <v-icon small left>mdi-eye</v-icon>
                  View All
                </v-btn>
              </v-card-title>

              <v-card-text class="pa-4">
                <!-- Connection Quality Overview -->
                <v-row class="mb-4">
                  <v-col cols="6" md="3" class="text-center">
                    <div class="connection-metric">
                      <div class="text-h4 font-weight-bold success--text">{{ strategicConnections?.highValue || 0 }}</div>
                      <div class="text-caption">High-Value</div>
                    </div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="connection-metric">
                      <div class="text-h4 font-weight-bold primary--text">{{ strategicConnections?.total || 0 }}</div>
                      <div class="text-caption">Total Connections</div>
                    </div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="connection-metric">
                      <div class="text-h4 font-weight-bold warning--text">{{ strategicConnections?.followUpPending || 0 }}</div>
                      <div class="text-caption">Follow-up Needed</div>
                    </div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="connection-metric">
                      <div class="text-h4 font-weight-bold info--text">{{ strategicConnections?.avgQualityScore || 0 }}</div>
                      <div class="text-caption">Avg Quality Score</div>
                    </div>
                  </v-col>
                </v-row>

                <!-- Top Strategic Connections -->
                <div v-if="strategicConnections?.topConnections?.length > 0">
                  <h4 class="text-subtitle-1 font-weight-bold mb-3">Top Strategic Connections:</h4>
                  <v-row>
                    <v-col
                      v-for="connection in strategicConnections.topConnections.slice(0, viewMode === 'summary' ? 2 : 4)"
                      :key="connection.id"
                      cols="12"
                      :md="viewMode === 'summary' ? 6 : 3"
                    >
                      <v-card outlined class="connection-card pa-3">
                        <div class="d-flex align-center mb-2">
                          <v-avatar size="32" class="mr-2" :color="getConnectionColor(connection.qualityScore)">
                            <span class="white--text text-caption">{{ getConnectionInitials(connection.name) }}</span>
                          </v-avatar>
                          <div class="flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ connection.name }}</div>
                            <div class="text-caption text--secondary">{{ connection.role }}</div>
                          </div>
                          <v-chip
                            x-small
                            :color="getConnectionColor(connection.qualityScore)"
                            text-color="white"
                          >
                            {{ connection.qualityScore }}
                          </v-chip>
                        </div>

                        <div v-if="connection.sharedTopics?.length > 0" class="mb-2">
                          <div class="text-caption text--secondary mb-1">Shared Interests:</div>
                          <v-chip
                            v-for="topic in connection.sharedTopics.slice(0, 2)"
                            :key="topic"
                            x-small
                            outlined
                            color="primary"
                            class="mr-1"
                          >
                            {{ topic }}
                          </v-chip>
                        </div>

                        <div class="d-flex justify-space-between align-center">
                          <v-chip
                            x-small
                            :color="connection.followUpStatus === 'completed' ? 'success' : 'warning'"
                            outlined
                          >
                            {{ getFollowUpStatusText(connection.followUpStatus) }}
                          </v-chip>
                          <v-btn
                            x-small
                            text
                            color="primary"
                            @click="quickFollowUp(connection)"
                          >
                            Follow Up
                          </v-btn>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>

                <!-- Business Value Statement -->
                <v-alert
                  v-if="strategicConnections?.businessValue"
                  type="success"
                  class="mt-4"
                  outlined
                  prominent
                >
                  <div class="font-weight-bold">Strategic Networking Impact:</div>
                  <div>{{ strategicConnections.businessValue }}</div>
                </v-alert>

                <!-- Quick Actions -->
                <div class="mt-4">
                  <v-btn
                    color="success"
                    outlined
                    small
                    class="mr-2"
                    @click="scheduleFollowUps"
                  >
                    <v-icon small left>mdi-calendar-plus</v-icon>
                    Schedule Follow-ups
                  </v-btn>
                  <v-btn
                    color="primary"
                    outlined
                    small
                    @click="exportConnections"
                  >
                    <v-icon small left>mdi-download</v-icon>
                    Export Contacts
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Network Visualization (All Views) -->
        <v-row class="mb-6">
          <v-col cols="12">
            <NetworkVisualization
              :network-data="networkData"
              :user-id="userId"
              :height="viewMode === 'summary' ? 400 : viewMode === 'professional' ? 500 : 600"
            />
          </v-col>
        </v-row>

        <!-- Impact Scores (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <h2 class="headline mb-4">Your Impact Score: {{ personalImpact?.overallImpact || 0 }}/100</h2>
            <v-row>
              <v-col cols="12" md="4">
                <v-progress-circular
                  :rotate="270"
                  :size="120"
                  :width="12"
                  :value="personalImpact?.contributionScore || 0"
                  color="primary"
                  class="mx-auto"
                >
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ personalImpact?.contributionScore || 0 }}</div>
                    <div class="text-caption">Contribution</div>
                  </div>
                </v-progress-circular>
              </v-col>
              <v-col cols="12" md="4">
                <v-progress-circular
                  :rotate="270"
                  :size="120"
                  :width="12"
                  :value="personalImpact?.networkingScore || 0"
                  color="success"
                  class="mx-auto"
                >
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ personalImpact?.networkingScore || 0 }}</div>
                    <div class="text-caption">Networking</div>
                  </div>
                </v-progress-circular>
              </v-col>
              <v-col cols="12" md="4">
                <v-progress-circular
                  :rotate="270"
                  :size="120"
                  :width="12"
                  :value="personalImpact?.collaborationScore || 0"
                  color="warning"
                  class="mx-auto"
                >
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ personalImpact?.collaborationScore || 0 }}</div>
                    <div class="text-caption">Collaboration</div>
                  </div>
                </v-progress-circular>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Key Metrics Cards (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col v-for="stat in shareableStats?.stats" :key="stat.label" cols="6" md="3">
            <v-card class="stat-card text-center pa-4" elevation="2">
              <div class="stat-emoji text-h3 mb-2">{{ stat.emoji }}</div>
              <div class="stat-value text-h4 font-weight-bold primary--text">{{ stat.value }}</div>
              <div class="stat-label text-caption">{{ stat.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Insights Section -->
        <v-row v-if="insights?.length > 0" class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-3">Your Event Highlights</h3>
            <v-row>
              <v-col v-for="insight in insights" :key="insight.type" cols="12" md="6">
                <v-alert
                  :icon="insight.icon"
                  prominent
                  type="success"
                  class="insight-card"
                >
                  <div class="font-weight-bold">{{ insight.title }}</div>
                  <div class="text-caption mt-1">{{ insight.description }}</div>
                </v-alert>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Enhanced Event Journey Timeline (Personal View Only) -->
        <v-row v-if="journey && viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold deep-purple white--text">
                <v-icon left color="white">mdi-map-marker-path</v-icon>
                Your Event Journey
                <v-spacer />
                <v-chip color="white" text-color="deep-purple" small>
                  {{ journey.keyMoments?.length || 0 }} key moments
                </v-chip>
              </v-card-title>
              
              <v-card-text class="pa-6">
                <!-- Journey Stats Overview -->
                <v-row class="mb-4">
                  <v-col cols="12" md="4" class="text-center">
                    <v-card outlined class="pa-4">
                      <v-icon size="32" color="primary" class="mb-2">mdi-clock</v-icon>
                      <div class="text-h5 font-weight-bold primary--text">{{ journey.activeMinutes || 0 }}</div>
                      <div class="text-caption">Minutes Active</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4" class="text-center">
                    <v-card outlined class="pa-4">
                      <v-icon size="32" color="success" class="mb-2">mdi-trending-up</v-icon>
                      <div class="text-h6 font-weight-bold success--text">{{ journey.peakEngagementTime || 'N/A' }}</div>
                      <div class="text-caption">Peak Engagement</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4" class="text-center">
                    <v-card outlined class="pa-4">
                      <v-icon size="32" color="warning" class="mb-2">mdi-star-circle</v-icon>
                      <div class="text-h5 font-weight-bold warning--text">{{ journey.highlightMoments || 0 }}</div>
                      <div class="text-caption">Highlight Moments</div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Interactive Timeline -->
                <v-timeline dense class="journey-timeline">
                  <v-timeline-item
                    v-for="(moment, index) in journey.keyMoments"
                    :key="`moment-${index}`"
                    :color="getTimelineColor(moment.type)"
                    large
                    class="timeline-moment"
                  >
                    <template v-slot:opposite>
                      <div class="text-caption font-weight-bold">
                        {{ moment.timestamp || `Step ${index + 1}` }}
                      </div>
                      <v-chip x-small :color="getTimelineColor(moment.type)" text-color="white">
                        {{ moment.count || 1 }}x
                      </v-chip>
                    </template>
                    
                    <v-card class="elevation-3 timeline-card" :class="`${moment.type}-card`">
                      <v-card-title class="py-3">
                        <v-icon :color="getTimelineColor(moment.type)" class="mr-2">
                          {{ getTimelineIcon(moment.type) }}
                        </v-icon>
                        <div>
                          <div class="text-body-1 font-weight-medium">{{ moment.title || moment.description }}</div>
                          <div v-if="moment.title && moment.description" class="text-caption text--secondary">
                            {{ moment.description }}
                          </div>
                        </div>
                      </v-card-title>
                      
                      <v-card-text v-if="moment.details" class="pt-0">
                        <div class="text-body-2">{{ moment.details }}</div>
                        
                        <!-- Show related topics/people if available -->
                        <div v-if="moment.relatedTopics?.length > 0" class="mt-2">
                          <v-chip
                            v-for="topic in moment.relatedTopics.slice(0, 3)"
                            :key="topic"
                            x-small
                            outlined
                            color="primary"
                            class="mr-1 mb-1"
                          >
                            {{ topic }}
                          </v-chip>
                        </div>
                        
                        <div v-if="moment.impact" class="mt-2">
                          <v-progress-linear 
                            :value="moment.impact" 
                            :color="getTimelineColor(moment.type)"
                            height="6"
                            rounded
                            class="mb-1"
                          />
                          <div class="text-caption">Impact Score: {{ moment.impact }}/100</div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>

                <!-- Journey Summary -->
                <v-card outlined class="mt-6 pa-4" color="grey lighten-5">
                  <v-card-title class="py-2">
                    <v-icon color="deep-purple" class="mr-2">mdi-chart-timeline-variant</v-icon>
                    Journey Summary
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <div class="mb-2">
                          <strong>Most Active Phase:</strong> 
                          {{ journey.mostActivePhase || 'Topic Discussion' }}
                        </div>
                        <div class="mb-2">
                          <strong>Engagement Style:</strong> 
                          {{ journey.engagementStyle || 'Active Participant' }}
                        </div>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="mb-2">
                          <strong>Collaboration Pattern:</strong> 
                          {{ journey.collaborationPattern || 'Team Player' }}
                        </div>
                        <div class="mb-2">
                          <strong>Key Contribution:</strong> 
                          {{ journey.keyContribution || 'Idea Generation' }}
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Impact Flow Visualization (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <SankeyFlowChart 
              :event-data="{ event, personalImpact, metrics, connections, collaborations }" 
              :user-id="userId"
              title="Your Event Impact Flow"
            />
          </v-col>
        </v-row>

        <!-- Ideas & Insights Generated -->
        <v-row v-if="generatedIdeas?.length > 0 && viewMode !== 'summary'" class="mb-6">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold success white--text">
                <v-icon left color="white">mdi-lightbulb-multiple</v-icon>
                {{ viewMode === 'professional' ? 'Key Ideas & Business Insights' : 'Ideas & Insights You Generated' }}
                <v-spacer />
                <v-chip color="white" text-color="success" small>
                  {{ generatedIdeas.length }} ideas
                </v-chip>
                <v-btn 
                  v-if="viewMode === 'professional'"
                  color="white" 
                  text 
                  small
                  class="ml-2"
                  @click="shareIdeas"
                >
                  <v-icon small left>mdi-share</v-icon>
                  Share
                </v-btn>
              </v-card-title>
              
              <v-card-text class="pa-6">
                <v-row>
                  <v-col
                    v-for="idea in generatedIdeas.slice(0, 6)"
                    :key="idea.id"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card outlined class="h-100 idea-preview-card">
                      <v-card-subtitle class="pb-2">
                        <div class="d-flex align-center justify-space-between">
                          <v-chip :color="getIdeaCategoryColor(idea.category)" text-color="white" x-small>
                            {{ formatIdeaCategory(idea.category) }}
                          </v-chip>
                          <v-rating
                            :value="idea.promisingScore"
                            color="amber"
                            background-color="grey lighten-2"
                            x-small
                            readonly
                            half-increments
                            dense
                          />
                        </div>
                      </v-card-subtitle>
                      
                      <v-card-text class="pt-0">
                        <div class="text-body-1 font-weight-medium mb-2">{{ idea.title }}</div>
                        <div class="text-body-2 text--secondary mb-3">
                          {{ idea.description.substring(0, 100) }}{{ idea.description.length > 100 ? '...' : '' }}
                        </div>
                        
                        <div class="d-flex align-center justify-space-between">
                          <div class="text-caption">
                            <v-icon small color="primary">mdi-forum</v-icon>
                            {{ getTopicTitle(idea.topicId) }}
                          </div>
                          <div v-if="idea.needsFollowUp" class="text-caption success--text">
                            <v-icon small color="success">mdi-rocket-launch</v-icon>
                            Follow-up planned
                          </div>
                        </div>

                        <div v-if="idea.interestedCount > 0" class="mt-2">
                          <v-chip x-small color="info" text-color="white">
                            <v-icon x-small left>mdi-account-group</v-icon>
                            {{ idea.interestedCount }} interested
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row v-if="generatedIdeas.length > 6" class="mt-4">
                  <v-col cols="12" class="text-center">
                    <v-btn outlined color="success" @click="showAllIdeas = !showAllIdeas">
                      <v-icon left>{{ showAllIdeas ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                      {{ showAllIdeas ? 'Show Less' : `Show ${generatedIdeas.length - 6} More Ideas` }}
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Additional ideas when expanded -->
                <v-row v-if="showAllIdeas && generatedIdeas.length > 6">
                  <v-col
                    v-for="idea in generatedIdeas.slice(6)"
                    :key="idea.id"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card outlined class="h-100 idea-preview-card">
                      <v-card-subtitle class="pb-2">
                        <div class="d-flex align-center justify-space-between">
                          <v-chip :color="getIdeaCategoryColor(idea.category)" text-color="white" x-small>
                            {{ formatIdeaCategory(idea.category) }}
                          </v-chip>
                          <v-rating
                            :value="idea.promisingScore"
                            color="amber"
                            background-color="grey lighten-2"
                            x-small
                            readonly
                            half-increments
                            dense
                          />
                        </div>
                      </v-card-subtitle>
                      
                      <v-card-text class="pt-0">
                        <div class="text-body-1 font-weight-medium mb-2">{{ idea.title }}</div>
                        <div class="text-body-2 text--secondary mb-3">
                          {{ idea.description.substring(0, 100) }}{{ idea.description.length > 100 ? '...' : '' }}
                        </div>
                        
                        <div class="d-flex align-center justify-space-between">
                          <div class="text-caption">
                            <v-icon small color="primary">mdi-forum</v-icon>
                            {{ getTopicTitle(idea.topicId) }}
                          </div>
                          <div v-if="idea.needsFollowUp" class="text-caption success--text">
                            <v-icon small color="success">mdi-rocket-launch</v-icon>
                            Follow-up planned
                          </div>
                        </div>

                        <div v-if="idea.interestedCount > 0" class="mt-2">
                          <v-chip x-small color="info" text-color="white">
                            <v-icon x-small left>mdi-account-group</v-icon>
                            {{ idea.interestedCount }} interested
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Most Promising Topics & Follow-ups -->
        <v-row v-if="viewMode !== 'summary'" class="mb-6">
          <!-- Follow-up Commitments (Prioritized in Professional View) -->
          <v-col :cols="viewMode === 'professional' ? 12 : 6" :order="viewMode === 'professional' ? 1 : 2">
            <v-card elevation="4" class="commitment-priority-card">
              <v-card-title class="text-h6 font-weight-bold info white--text">
                <v-icon left color="white">mdi-rocket-launch</v-icon>
                {{ viewMode === 'professional' ? 'Active Projects & Commitments' : 'Follow-up Commitments' }}
                <v-spacer />
                <v-chip color="white" text-color="info" small v-if="followUpCommitments?.length > 0">
                  {{ followUpCommitments.length }} {{ viewMode === 'professional' ? 'projects' : 'commitments' }}
                </v-chip>
                <v-btn 
                  v-if="viewMode === 'professional'"
                  color="white" 
                  text 
                  small
                  class="ml-2"
                  @click="shareCommitments"
                >
                  <v-icon small left>mdi-share</v-icon>
                  Share
                </v-btn>
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div v-if="followUpCommitments?.length > 0">
                  <v-expansion-panels multiple variant="accordion">
                    <v-expansion-panel
                      v-for="commitment in followUpCommitments"
                      :key="commitment.id"
                      class="mb-2"
                    >
                      <v-expansion-panel-header class="py-3">
                        <div class="d-flex align-center justify-space-between w-100">
                          <div class="flex-grow-1">
                            <div class="text-body-1 font-weight-medium">{{ commitment.title }}</div>
                            <div class="text-caption text--secondary mt-1">{{ commitment.description }}</div>
                            <!-- Business Value (Professional View) -->
                            <div v-if="viewMode === 'professional'" class="text-caption success--text mt-1">
                              <v-icon x-small color="success">mdi-trending-up</v-icon>
                              Potential business impact: {{ getBusinessImpact(commitment) }}
                            </div>
                          </div>
                          <div class="ml-3 d-flex align-center">
                            <v-chip 
                              x-small 
                              :color="getCommitmentColor(commitment.priority)" 
                              text-color="white"
                              class="mr-2"
                            >
                              {{ commitment.priority }} priority
                            </v-chip>
                            <v-avatar size="24" v-if="commitment.collaborators?.length > 0">
                              <span class="text-caption">{{ commitment.collaborators.length }}</span>
                            </v-avatar>
                          </div>
                        </div>
                      </v-expansion-panel-header>
                      
                      <v-expansion-panel-content>
                        <v-divider class="mb-4" />
                        
                        <div v-if="commitment.collaborators?.length > 0">
                          <h4 class="text-subtitle-2 font-weight-bold mb-3">
                            <v-icon small color="primary" class="mr-1">mdi-account-group</v-icon>
                            {{ viewMode === 'professional' ? 'Team Members' : 'Collaborators' }} ({{ commitment.collaborators.length }})
                          </h4>
                          
                          <v-row>
                            <v-col 
                              v-for="collaborator in commitment.collaborators" 
                              :key="collaborator.id"
                              cols="12"
                              class="py-2"
                            >
                              <v-card outlined class="pa-3">
                                <div class="d-flex align-center">
                                  <v-avatar size="40" class="mr-3">
                                    <img :src="collaborator.avatar || '/default-avatar.png'" :alt="collaborator.name">
                                  </v-avatar>
                                  
                                  <div class="flex-grow-1">
                                    <div class="text-body-2 font-weight-medium">{{ collaborator.name }}</div>
                                    <div class="text-caption text--secondary">{{ collaborator.company }}</div>
                                    <div class="text-caption">{{ collaborator.role }}</div>
                                  </div>
                                  
                                  <div class="d-flex flex-column align-end">
                                    <v-btn 
                                      x-small 
                                      color="primary" 
                                      outlined
                                      :href="`mailto:${collaborator.email}`"
                                      class="mb-1"
                                    >
                                      <v-icon x-small class="mr-1">mdi-email</v-icon>
                                      Email
                                    </v-btn>
                                    <v-btn 
                                      v-if="collaborator.linkedin"
                                      x-small 
                                      color="blue" 
                                      outlined
                                      :href="collaborator.linkedin"
                                      target="_blank"
                                    >
                                      <v-icon x-small class="mr-1">mdi-linkedin</v-icon>
                                      LinkedIn
                                    </v-btn>
                                  </div>
                                </div>
                                
                                <v-chip 
                                  v-if="collaborator.expertise"
                                  x-small 
                                  color="success" 
                                  outlined 
                                  class="mt-2"
                                >
                                  Expertise: {{ collaborator.expertise }}
                                </v-chip>
                              </v-card>
                            </v-col>
                          </v-row>
                        </div>

                        <div v-if="commitment.nextSteps?.length > 0" class="mt-4">
                          <h4 class="text-subtitle-2 font-weight-bold mb-2">
                            <v-icon small color="success" class="mr-1">mdi-check-circle</v-icon>
                            Next Steps
                          </h4>
                          <v-list dense>
                            <v-list-item 
                              v-for="step in commitment.nextSteps" 
                              :key="step.id"
                              class="px-0"
                            >
                              <template v-slot:prepend>
                                <v-icon small>mdi-chevron-right</v-icon>
                              </template>
                              <v-list-item-title class="text-body-2">{{ step.action }}</v-list-item-title>
                              <v-list-item-subtitle v-if="step.deadline">
                                Due: {{ formatDate(step.deadline) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </div>

                        <div v-if="commitment.timeline" class="mt-4">
                          <h4 class="text-subtitle-2 font-weight-bold mb-2">
                            <v-icon small color="warning" class="mr-1">mdi-calendar-clock</v-icon>
                            Timeline: {{ commitment.timeline }}
                          </h4>
                        </div>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
                
                <div v-else class="text-center pa-4">
                  <v-icon color="grey lighten-1" size="48">mdi-rocket-launch-outline</v-icon>
                  <div class="text-body-2 grey--text mt-2">No follow-up commitments yet</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Most Promising Topics (Smaller in Professional View) -->
          <v-col 
            v-if="viewMode !== 'professional' || (promisingTopics?.length > 0)"
            :cols="viewMode === 'professional' ? 12 : 6" 
            :order="viewMode === 'professional' ? 2 : 1"
          >
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold warning white--text">
                <v-icon left color="white">mdi-star-circle</v-icon>
                {{ viewMode === 'professional' ? 'Key Topics Explored' : 'Most Promising Topics' }}
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div v-if="promisingTopics?.length > 0">
                  <div
                    v-for="(topic, index) in promisingTopics.slice(0, viewMode === 'professional' ? 3 : 5)"
                    :key="topic.id"
                    class="topic-ranking-item mb-3 pa-3"
                    :class="getRankingClass(index)"
                  >
                    <div class="d-flex align-center">
                      <div class="ranking-badge mr-3">
                        <div class="text-h6 font-weight-bold">{{ index + 1 }}</div>
                      </div>
                      <div class="flex-grow-1">
                        <div class="text-body-1 font-weight-medium">{{ topic.title }}</div>
                        <div class="text-caption text--secondary">
                          {{ topic.participantCount }} participants • {{ topic.ideasGenerated }} ideas
                        </div>
                      </div>
                      <div v-if="viewMode !== 'professional'" class="text-right">
                        <v-rating
                          :value="topic.engagementScore"
                          color="amber"
                          background-color="grey lighten-2"
                          small
                          readonly
                          half-increments
                          dense
                        />
                        <div class="text-caption">{{ topic.engagementScore }}/5</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center pa-4">
                  <v-icon color="grey lighten-1" size="48">mdi-chart-line</v-icon>
                  <div class="text-body-2 grey--text mt-2">Topic rankings will appear here</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Survey Results & Topic Discussion Analytics (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-3">📊 Event Analytics & Insights</h3>
          </v-col>
        </v-row>

        <!-- Survey/Voting Sentiment Analysis (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold purple white--text">
                <v-icon left color="white">mdi-poll</v-icon>
                Survey Results & Sentiment Analysis
              </v-card-title>
              
              <v-card-text class="pa-4">
                <DivergingStackedBar
                  :data="surveyData"
                  title="How did participants feel about key topics?"
                  :height="300"
                  :show-legend="true"
                />
                
                <div v-if="surveyInsights?.length > 0" class="mt-4">
                  <h4 class="text-subtitle-1 font-weight-bold mb-2">Key Insights:</h4>
                  <v-list dense>
                    <v-list-item v-for="insight in surveyInsights" :key="insight.id">
                      <template v-slot:prepend>
                        <v-icon :color="insight.type === 'positive' ? 'success' : insight.type === 'negative' ? 'error' : 'warning'">
                          {{ insight.type === 'positive' ? 'mdi-trending-up' : insight.type === 'negative' ? 'mdi-trending-down' : 'mdi-information' }}
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">{{ insight.message }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Topic Discussion Heatmap (Personal View Only) -->
        <v-row v-if="viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold teal white--text">
                <v-icon left color="white">mdi-forum</v-icon>
                Topic Discussion Frequency
              </v-card-title>
              
              <v-card-text class="pa-4">
                <TreeMapChart
                  :data="topicDiscussionData"
                  title="Topic Engagement: Discussions & People Involved"
                  :height="350"
                  :show-details="true"
                />
                
                <div v-if="discussionInsights?.length > 0" class="mt-4">
                  <h4 class="text-subtitle-1 font-weight-bold mb-2">Discussion Highlights:</h4>
                  <v-row>
                    <v-col v-for="insight in discussionInsights" :key="insight.metric" cols="12" md="4">
                      <v-card outlined class="pa-3 text-center">
                        <v-icon :color="insight.color" size="24" class="mb-1">{{ insight.icon }}</v-icon>
                        <div class="text-h6 font-weight-bold">{{ insight.value }}</div>
                        <div class="text-caption text--secondary">{{ insight.metric }}</div>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Connections Grid -->
        <v-row v-if="connections?.length > 0 && viewMode !== 'summary'" class="mb-6">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 font-weight-bold primary white--text">
                <v-icon left color="white">mdi-account-network</v-icon>
                {{ viewMode === 'professional' ? 'Strategic Connections Made' : 'Your New Connections' }}
                <v-spacer />
                <v-chip color="white" text-color="primary" small>
                  {{ connections.length }} connections
                </v-chip>
                <v-btn 
                  v-if="viewMode === 'professional'"
                  color="white" 
                  text 
                  small
                  class="ml-2"
                  @click="shareConnections"
                >
                  <v-icon small left>mdi-share</v-icon>
                  Share
                </v-btn>
              </v-card-title>

              <v-card-text class="pa-4">
                <v-row>
                  <v-col 
                    v-for="conn in connections.slice(0, viewMode === 'professional' ? 6 : 8)" 
                    :key="conn.person.id" 
                    cols="6" 
                    md="4" 
                    lg="3"
                  >
                    <v-card class="connection-card text-center pa-3" elevation="1">
                      <v-avatar size="60" class="mb-2">
                        <img :src="conn.person.avatar || '/default-avatar.png'" :alt="conn.person.name">
                      </v-avatar>
                      <div class="text-subtitle-2 font-weight-bold">{{ conn.person.name }}</div>
                      <div class="text-caption text--secondary">{{ conn.person.company }}</div>
                      <div class="text-caption mb-2">{{ conn.person.role }}</div>
                      <v-chip
                        v-if="viewMode !== 'professional'"
                        x-small
                        :color="getStrengthColor(conn.strength)"
                        class="mt-1"
                      >
                        Strength: {{ conn.strength }}
                      </v-chip>
                      <div v-if="conn.sharedTopics?.length > 0" class="text-caption mt-2">
                        {{ conn.sharedTopics.length }} shared interests
                      </div>
                      <div v-if="viewMode === 'professional'" class="mt-2">
                        <v-chip
                          v-for="topic in conn.sharedTopics?.slice(0, 1)"
                          :key="topic"
                          x-small
                          outlined
                          color="primary"
                          class="mb-1"
                        >
                          {{ topic }}
                        </v-chip>
                      </div>
                      <v-btn
                        v-if="conn.person.linkedin"
                        icon
                        x-small
                        color="primary"
                        :href="conn.person.linkedin"
                        target="_blank"
                        class="mt-2"
                      >
                        <v-icon>mdi-linkedin</v-icon>
                      </v-btn>
                    </v-card>
                  </v-col>
                </v-row>
                <div v-if="connections.length > (viewMode === 'professional' ? 6 : 8)" class="text-center mt-3">
                  <v-btn text color="primary">
                    View all {{ connections.length }} connections
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Achievements (Personal View Only) -->
        <v-row v-if="achievements?.length > 0 && viewMode === 'personal'" class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-3">Achievements Unlocked</h3>
            <v-row>
              <v-col v-for="achievement in achievements" :key="achievement.name" cols="6" md="4">
                <v-card class="achievement-card text-center pa-3" elevation="2">
                  <v-icon size="40" :color="getAchievementColor(achievement.type)">
                    {{ achievement.icon }}
                  </v-icon>
                  <div class="text-subtitle-2 font-weight-bold mt-2">{{ achievement.name }}</div>
                  <div class="text-caption">{{ achievement.description }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Enhanced Share Section -->
        <v-row class="mt-8">
          <v-col cols="12">
            <v-card class="share-section pa-6" elevation="8">
              <v-card-title class="text-center pb-6">
                <div class="w-100">
                  <h3 class="text-h3 font-weight-bold primary--text mb-2">
                    {{ getShareTitle() }}
                  </h3>
                  <p class="text-h6 text--secondary">{{ getShareSubtitle() }}</p>
                  <p class="text-body-1 mt-2">{{ getShareDescription() }}</p>
                </div>
              </v-card-title>

              <!-- Professional Sharing Options (Professional View) -->
              <v-card-text v-if="viewMode === 'professional'">
                <v-row class="mb-4">
                  <v-col cols="12">
                    <h4 class="text-h6 font-weight-bold mb-3">Choose what to share:</h4>
                    <v-row>
                      <v-col cols="6" md="3">
                        <v-checkbox
                          v-model="sharingOptions.executiveSummary"
                          label="Executive Summary"
                          color="primary"
                        />
                      </v-col>
                      <v-col cols="6" md="3">
                        <v-checkbox
                          v-model="sharingOptions.commitments"
                          label="Active Projects"
                          color="primary"
                        />
                      </v-col>
                      <v-col cols="6" md="3">
                        <v-checkbox
                          v-model="sharingOptions.ideas"
                          label="Key Ideas"
                          color="primary"
                        />
                      </v-col>
                      <v-col cols="6" md="3">
                        <v-checkbox
                          v-model="sharingOptions.connections"
                          label="New Connections"
                          color="primary"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>

                <!-- Professional Share Buttons -->
                <v-row class="professional-share-grid">
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="professional-share-card linkedin-card text-center pa-6" 
                      elevation="4"
                      @click="shareProfessionalContent('linkedin')"
                      hover
                    >
                      <v-icon size="60" color="white">mdi-linkedin</v-icon>
                      <div class="text-h6 font-weight-bold white--text mt-3">Share on LinkedIn</div>
                      <div class="text-body-2 white--text mt-1">Professional network</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="professional-share-card email-card text-center pa-6" 
                      elevation="4"
                      @click="shareProfessionalContent('email')"
                      hover
                    >
                      <v-icon size="60" color="white">mdi-email</v-icon>
                      <div class="text-h6 font-weight-bold white--text mt-3">Email to Team</div>
                      <div class="text-body-2 white--text mt-1">Colleagues & managers</div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Professional Share Text Preview -->
                <v-card class="mt-4 pa-4" outlined>
                  <v-card-subtitle class="text-subtitle-1 font-weight-bold">Share Preview:</v-card-subtitle>
                  <v-card-text>
                    <v-textarea
                      :value="generateProfessionalShareText()"
                      outlined
                      readonly
                      rows="4"
                      hide-details
                      class="share-text-preview"
                      append-icon="mdi-content-copy"
                      @click:append="copyProfessionalText"
                    />
                  </v-card-text>
                </v-card>
              </v-card-text>

              <!-- Regular Social Media Logos (Personal/Summary View) -->
              <v-card-text v-else>
                <v-row class="social-logos-grid">
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="social-logo-card linkedin-card text-center pa-8" 
                      elevation="4"
                      @click="shareToLinkedIn"
                      hover
                    >
                      <v-icon size="80" color="white">mdi-linkedin</v-icon>
                      <div class="text-h5 font-weight-bold white--text mt-4">LinkedIn</div>
                      <div class="text-body-2 white--text mt-2">Share with your professional network</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="social-logo-card twitter-card text-center pa-8" 
                      elevation="4"
                      @click="shareToTwitter"
                      hover
                    >
                      <v-icon size="80" color="white">mdi-twitter</v-icon>
                      <div class="text-h5 font-weight-bold white--text mt-4">Twitter</div>
                      <div class="text-body-2 white--text mt-2">Tweet your achievements</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="social-logo-card email-card text-center pa-8" 
                      elevation="4"
                      @click="emailRecap"
                      hover
                    >
                      <v-icon size="80" color="white">mdi-email</v-icon>
                      <div class="text-h5 font-weight-bold white--text mt-4">Email</div>
                      <div class="text-body-2 white--text mt-2">Send to colleagues & friends</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6" class="pa-2">
                    <v-card 
                      class="social-logo-card copy-card text-center pa-8" 
                      elevation="4"
                      @click="copyShareText"
                      hover
                    >
                      <v-icon size="80" color="white">mdi-content-copy</v-icon>
                      <div class="text-h5 font-weight-bold white--text mt-4">Copy Link</div>
                      <div class="text-body-2 white--text mt-2">Share anywhere you want</div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Share Text Preview -->
                <v-card class="mt-6 pa-4" outlined>
                  <v-card-subtitle class="text-subtitle-1 font-weight-bold">Preview Your Share Text:</v-card-subtitle>
                  <v-card-text>
                    <v-textarea
                      v-model="shareableStats.shareText"
                      outlined
                      readonly
                      rows="3"
                      hide-details
                      class="share-text-preview"
                      append-icon="mdi-content-copy"
                      @click:append="copyShareText"
                    />
                  </v-card-text>
                </v-card>

                <!-- Hashtags -->
                <div class="text-center mt-4">
                  <v-chip
                    v-for="tag in shareableStats?.hashtags"
                    :key="tag"
                    class="ma-1"
                    color="primary"
                    text-color="white"
                    outlined
                  >
                    #{{ tag }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Download/Email Options -->
        <v-row class="mt-6">
          <v-col cols="12" class="text-center">
            <v-btn color="primary" class="mr-2" @click="downloadPDF">
              <v-icon left>mdi-download</v-icon>
              Download PDF
            </v-btn>
            <v-btn color="primary" outlined @click="emailRecap">
              <v-icon left>mdi-email</v-icon>
              Email Recap
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Email Dialog -->
    <v-dialog v-model="emailDialog" max-width="500px">
      <v-card>
        <v-card-title>Email Your Recap</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="emailAddress"
            label="Email Address"
            type="email"
            outlined
            dense
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="emailDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="sendEmail">Send</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" top right>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SankeyFlowChart from './SankeyFlowChart.vue'
import DivergingStackedBar from './DivergingStackedBar.vue'
import TreeMapChart from './TreeMapChart.vue'
import NetworkVisualization from './NetworkVisualization.vue'
import { useConnectionIntelligence } from '~/composables/useConnectionIntelligence'

const props = defineProps<{
  eventId: string
  userId: string
}>()

// Connection Intelligence System
const {
  calculateConnectionQuality,
  calculateConnectionStrength,
  generateFollowUpRecommendations,
  analyzeNetworkHealth
} = useConnectionIntelligence()

// View mode state
const viewMode = ref<'professional' | 'personal' | 'summary'>('professional')

// Sharing options for professional view
const sharingOptions = ref({
  executiveSummary: true,
  commitments: true,
  ideas: true,
  connections: false
})

// Data refs
const event = ref<any>(null)
const personalImpact = ref<any>(null)
const metrics = ref<any>(null)
const journey = ref<any>(null)
const connections = ref<any[]>([])
const collaborations = ref<any[]>([])
const achievements = ref<any[]>([])
const insights = ref<any[]>([])
const shareableStats = ref<any>(null)

// New data for ideas and insights
const generatedIdeas = ref<any[]>([])
const promisingTopics = ref<any[]>([])
const followUpCommitments = ref<any[]>([])
const showAllIdeas = ref(false)

// Strategic connections data
const strategicConnections = ref<any>(null)

// Network visualization data
const networkData = ref<any>(null)

// Professional metrics and ROI data
const professionalMetrics = ref<any>(null)
const executiveInsights = ref<any>(null)

// Survey and discussion analytics data
const surveyData = ref<any[]>([])
const surveyInsights = ref<any[]>([])
const topicDiscussionData = ref<any[]>([])
const discussionInsights = ref<any[]>([])

// UI state
const emailDialog = ref(false)
const emailAddress = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Fetch personal recap data
async function fetchRecap() {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/personal-recap`, {
      params: { userId: props.userId }
    })

    // Destructure response
    event.value = response.event
    personalImpact.value = response.personalImpact
    metrics.value = response.metrics
    journey.value = response.journey
    connections.value = response.connections
    collaborations.value = response.collaborations
    achievements.value = response.achievements
    insights.value = response.insights
    shareableStats.value = response.shareableStats
  } catch (error) {
    console.error('Error fetching personal recap:', error)
    showSnackbar('Error loading recap data', 'error')
  }
}

// Share functions
function shareToLinkedIn() {
  const text = encodeURIComponent(shareableStats.value?.shareText || '')
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank')
}

function shareToTwitter() {
  const text = encodeURIComponent(shareableStats.value?.shareText || '')
  const hashtags = shareableStats.value?.hashtags?.join(',') || ''
  window.open(`https://twitter.com/intent/tweet?text=${text}&hashtags=${hashtags}`, '_blank')
}

async function copyShareText() {
  try {
    await navigator.clipboard.writeText(shareableStats.value?.shareText || '')
    showSnackbar('Share text copied to clipboard!', 'success')
  } catch (error) {
    showSnackbar('Failed to copy text', 'error')
  }
}

// Download PDF
async function downloadPDF() {
  try {
    // This would call an API endpoint to generate PDF
    showSnackbar('PDF download feature coming soon!', 'info')
  } catch (error) {
    showSnackbar('Error generating PDF', 'error')
  }
}

// Email recap
function emailRecap() {
  emailDialog.value = true
}

async function sendEmail() {
  try {
    // Call API to send email
    await $fetch(`/api/events/${props.eventId}/summary/email`, {
      method: 'POST',
      body: {
        userId: props.userId,
        email: emailAddress.value
      }
    })
    emailDialog.value = false
    showSnackbar('Recap sent to your email!', 'success')
  } catch (error) {
    showSnackbar('Error sending email', 'error')
  }
}

// View mode helper functions
function getShareTitle() {
  switch (viewMode.value) {
    case 'professional':
      return '📊 Share Professional Summary'
    case 'summary':
      return '⚡ Quick Share'
    default:
      return '🌟 Share Your Impact'
  }
}

function getShareSubtitle() {
  switch (viewMode.value) {
    case 'professional':
      return 'Show colleagues the business value of your participation'
    case 'summary':
      return 'Quick overview of your key outcomes'
    default:
      return shareableStats.value?.headline || 'Your event participation summary'
  }
}

function getShareDescription() {
  switch (viewMode.value) {
    case 'professional':
      return 'Select the most relevant information to share with your team, manager, or professional network.'
    case 'summary':
      return 'Share your top 3 outcomes in one click.'
    default:
      return 'Share your impact and inspire others to join the next event!'
  }
}

function getTopOutcome(index: number) {
  const outcomes = [
    `Led AI Ethics discussion with ${followUpCommitments.value?.[0]?.collaborators?.length || 0} team members`,
    `Generated ${generatedIdeas.value?.length || 0} actionable business ideas`,
    `Connected with ${connections.value?.length || 0} strategic partners`
  ]
  return outcomes[index - 1] || 'Participated in event activities'
}

function getBusinessImpact(commitment: any) {
  const impacts = [
    'Process improvement & automation opportunities',
    'New partnership & collaboration potential', 
    'Innovation pipeline development',
    'Strategic insights & market intelligence'
  ]
  return impacts[Math.floor(Math.random() * impacts.length)]
}

// Professional sharing functions
function generateProfessionalShareText() {
  let text = `🎯 Key outcomes from ${event.value?.title}:\n\n`
  
  if (sharingOptions.value.executiveSummary) {
    text += `📊 IMPACT SUMMARY:\n`
    text += `• ${followUpCommitments.value?.length || 0} active projects initiated\n`
    text += `• ${generatedIdeas.value?.length || 0} actionable ideas developed\n`
    text += `• ${connections.value?.length || 0} strategic connections made\n\n`
  }
  
  if (sharingOptions.value.commitments && followUpCommitments.value?.length > 0) {
    text += `🚀 FOLLOW-UP PROJECTS:\n`
    followUpCommitments.value.slice(0, 2).forEach(commitment => {
      text += `• ${commitment.title}: ${commitment.description}\n`
      text += `  Timeline: ${commitment.timeline} | Team: ${commitment.collaborators?.length || 0} members\n`
    })
    text += '\n'
  }
  
  if (sharingOptions.value.ideas && generatedIdeas.value?.length > 0) {
    text += `💡 TOP IDEAS:\n`
    generatedIdeas.value.slice(0, 2).forEach(idea => {
      text += `• ${idea.title}: ${idea.description.substring(0, 60)}...\n`
    })
    text += '\n'
  }
  
  if (sharingOptions.value.connections && connections.value?.length > 0) {
    text += `🤝 KEY CONNECTIONS:\n`
    connections.value.slice(0, 3).forEach(conn => {
      text += `• ${conn.person.name} (${conn.person.company})\n`
    })
    text += '\n'
  }
  
  text += `Ready to explore collaboration opportunities and implement these insights! #${event.value?.title?.replace(/\s+/g, '') || 'Unconference'}`
  
  return text
}

async function copyProfessionalText() {
  try {
    await navigator.clipboard.writeText(generateProfessionalShareText())
    showSnackbar('Professional summary copied to clipboard!', 'success')
  } catch (error) {
    showSnackbar('Failed to copy text', 'error')
  }
}

function shareProfessionalContent(platform: string) {
  const text = generateProfessionalShareText()
  
  if (platform === 'linkedin') {
    const encodedText = encodeURIComponent(text)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${encodedText}`, '_blank')
  } else if (platform === 'email') {
    const subject = encodeURIComponent(`${event.value?.title} - Key Outcomes & Follow-up`)
    const body = encodeURIComponent(text)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }
}

// Individual section sharing
function shareExecutiveSummary() {
  const text = `📊 Executive Summary from ${event.value?.title}:\n\n${generateProfessionalShareText()}`
  copyToClipboard(text, 'Executive summary copied!')
}

function shareCommitments() {
  let text = `🚀 Active Projects from ${event.value?.title}:\n\n`
  followUpCommitments.value?.forEach((commitment, index) => {
    text += `${index + 1}. ${commitment.title}\n`
    text += `   ${commitment.description}\n`
    text += `   Timeline: ${commitment.timeline} | Team: ${commitment.collaborators?.length || 0} members\n\n`
  })
  copyToClipboard(text, 'Project commitments copied!')
}

function shareIdeas() {
  let text = `💡 Key Ideas from ${event.value?.title}:\n\n`
  generatedIdeas.value?.slice(0, 5).forEach((idea, index) => {
    text += `${index + 1}. ${idea.title}\n`
    text += `   ${idea.description}\n`
    text += `   Category: ${formatIdeaCategory(idea.category)}\n\n`
  })
  copyToClipboard(text, 'Ideas copied!')
}

function shareConnections() {
  let text = `🤝 Strategic Connections from ${event.value?.title}:\n\n`
  connections.value?.slice(0, 8).forEach((conn, index) => {
    text += `${index + 1}. ${conn.person.name}\n`
    text += `   ${conn.person.role} at ${conn.person.company}\n`
    if (conn.sharedTopics?.length > 0) {
      text += `   Shared interests: ${conn.sharedTopics.join(', ')}\n`
    }
    text += '\n'
  })
  copyToClipboard(text, 'Connections list copied!')
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar(successMessage, 'success')
  } catch (error) {
    showSnackbar('Failed to copy text', 'error')
  }
}

// Helper functions
function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function getTimelineColor(type: string) {
  const colors: Record<string, string> = {
    topic_proposed: 'primary',
    voting: 'success',
    participation: 'warning',
    collaboration: 'info',
    idea_generation: 'purple',
    networking: 'pink',
    discussion: 'teal',
    achievement: 'orange'
  }
  return colors[type] || 'grey'
}

function getTimelineIcon(type: string) {
  const icons: Record<string, string> = {
    topic_proposed: 'mdi-lightbulb',
    voting: 'mdi-vote',
    participation: 'mdi-account-group',
    collaboration: 'mdi-handshake',
    idea_generation: 'mdi-brain',
    networking: 'mdi-account-network',
    discussion: 'mdi-chat',
    achievement: 'mdi-trophy'
  }
  return icons[type] || 'mdi-circle'
}

function getStrengthColor(strength: number) {
  if (strength >= 8) return 'success'
  if (strength >= 5) return 'warning'
  return 'grey'
}

function getAchievementColor(type: string) {
  const colors: Record<string, string> = {
    CONNECTION: 'primary',
    COLLABORATION: 'success',
    KNOWLEDGE: 'warning',
    COMMUNITY: 'error'
  }
  return colors[type] || 'grey'
}

// Strategic Connections methods
function getConnectionColor(qualityScore: number) {
  if (qualityScore >= 80) return 'success'
  if (qualityScore >= 60) return 'warning'
  if (qualityScore >= 40) return 'primary'
  return 'grey'
}

function getConnectionInitials(name: string) {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
}

function getFollowUpStatusText(status: string) {
  const statusMap: Record<string, string> = {
    'pending': 'Follow-up needed',
    'in_progress': 'In progress',
    'completed': 'Connected'
  }
  return statusMap[status] || status
}

function getQualityScoreText(score: number) {
  if (score >= 90) return 'Exceptional'
  if (score >= 80) return 'High Value'
  if (score >= 70) return 'Strong Potential'
  if (score >= 60) return 'Good Match'
  return 'Developing'
}

function getConnectionPriorityIcon(priority: string) {
  switch (priority) {
    case 'high': return 'mdi-priority-high'
    case 'medium': return 'mdi-equal'
    case 'low': return 'mdi-priority-low'
    default: return 'mdi-circle'
  }
}

function getBusinessValueDisplay(value: number) {
  if (value >= 10000) return `$${(value / 1000).toFixed(0)}K+`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value}`
}

function getConnectionStrengthColor(strength: string) {
  switch (strength?.toLowerCase()) {
    case 'strong': return 'success'
    case 'medium': return 'warning'
    case 'weak': return 'grey'
    default: return 'grey'
  }
}

function viewAllConnections() {
  // Navigate to connections page or open detailed view
  showSnackbar('Opening detailed connections view...', 'info')
}

function quickFollowUp(connection: any) {
  // Open follow-up dialog or quick action
  showSnackbar(`Preparing follow-up with ${connection.name}...`, 'info')
}

function scheduleFollowUps() {
  // Open scheduling interface
  showSnackbar('Opening follow-up scheduler...', 'info')
}

function exportConnections() {
  // Export connections data
  showSnackbar('Exporting connection data...', 'info')
}

// New helper methods for ideas and insights
function getIdeaCategoryColor(category: string) {
  const colors: Record<string, string> = {
    insight: 'blue',
    solution: 'green',
    opportunity: 'orange',
    challenge: 'red',
    resource: 'purple',
    connection: 'teal',
    'next-step': 'indigo'
  }
  return colors[category] || 'grey'
}

function formatIdeaCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
}

function getTopicTitle(topicId: string) {
  // In real implementation, this would lookup topic titles
  const topicTitles: Record<string, string> = {
    'topic1': 'AI Ethics & Governance',
    'topic2': 'Climate Technology Solutions', 
    'topic3': 'Remote Work Innovation',
    'topic4': 'Community Building',
    'topic5': 'Digital Wellness'
  }
  return topicTitles[topicId] || 'Unknown Topic'
}

function getRankingClass(index: number) {
  if (index === 0) return 'gold-ranking'
  if (index === 1) return 'silver-ranking' 
  if (index === 2) return 'bronze-ranking'
  return 'regular-ranking'
}

function getCommitmentColor(priority: string) {
  const colors: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }
  return colors[priority] || 'grey'
}

function loadSampleIdeaData() {
  // Sample data for ideas - in real implementation this would come from the API
  generatedIdeas.value = [
    {
      id: '1',
      topicId: 'topic1',
      title: 'AI Bias Detection Framework',
      description: 'A comprehensive framework for automatically detecting and mitigating bias in AI systems before deployment. This could be implemented as an open-source library.',
      category: 'solution',
      promisingScore: 4.5,
      needsFollowUp: true,
      interestedCount: 8
    },
    {
      id: '2', 
      topicId: 'topic2',
      title: 'Community Solar Sharing Insight',
      description: 'Discovered that neighborhood energy sharing could reduce costs by 40% while increasing renewable adoption.',
      category: 'insight',
      promisingScore: 4.2,
      needsFollowUp: false,
      interestedCount: 12
    },
    {
      id: '3',
      topicId: 'topic3',
      title: 'Async Meeting Best Practices',
      description: 'Structured async meeting templates that increase productivity by eliminating scheduling conflicts.',
      category: 'opportunity',
      promisingScore: 3.8,
      needsFollowUp: true,
      interestedCount: 6
    }
  ]

  promisingTopics.value = [
    {
      id: 'topic1',
      title: 'AI Ethics & Governance',
      participantCount: 15,
      ideasGenerated: 8,
      engagementScore: 4.7
    },
    {
      id: 'topic2',
      title: 'Climate Technology Solutions',
      participantCount: 12,
      ideasGenerated: 12,
      engagementScore: 4.5
    },
    {
      id: 'topic3',
      title: 'Remote Work Innovation',
      participantCount: 10,
      ideasGenerated: 6,
      engagementScore: 4.1
    }
  ]

  followUpCommitments.value = [
    {
      id: '1',
      title: 'AI Bias Detection Tool',
      description: 'Create open-source library for bias detection in machine learning models',
      priority: 'high',
      timeline: '3 months',
      collaborators: [
        {
          id: 'user1',
          name: 'Dr. Sarah Chen',
          company: 'TechEthics Institute',
          role: 'AI Ethics Researcher',
          email: 'sarah.chen@techethics.org',
          linkedin: 'https://linkedin.com/in/sarahchen-ai',
          avatar: '/avatars/sarah.jpg',
          expertise: 'Machine Learning Ethics'
        },
        {
          id: 'user2',
          name: 'Marcus Rodriguez',
          company: 'OpenAI Labs',
          role: 'Senior ML Engineer',
          email: 'marcus@openailabs.com',
          linkedin: 'https://linkedin.com/in/marcusrodriguez',
          avatar: '/avatars/marcus.jpg',
          expertise: 'Algorithm Development'
        },
        {
          id: 'user3',
          name: 'Jennifer Kim',
          company: 'FairTech Solutions',
          role: 'Product Manager',
          email: 'j.kim@fairtech.com',
          linkedin: 'https://linkedin.com/in/jenniferkim-pm',
          avatar: '/avatars/jennifer.jpg',
          expertise: 'Product Strategy'
        }
      ],
      nextSteps: [
        {
          id: 'step1',
          action: 'Set up project repository and initial architecture',
          deadline: '2024-01-15'
        },
        {
          id: 'step2',
          action: 'Research existing bias detection frameworks',
          deadline: '2024-01-30'
        },
        {
          id: 'step3',
          action: 'Weekly team standup meetings',
          deadline: '2024-02-01'
        }
      ]
    },
    {
      id: '2',
      title: 'Solar Sharing Research',
      description: 'Research regulatory barriers and create policy recommendations for community energy sharing',
      priority: 'medium',
      timeline: '6 months',
      collaborators: [
        {
          id: 'user4',
          name: 'Prof. Ahmed Hassan',
          company: 'Green Energy University',
          role: 'Energy Policy Professor',
          email: 'ahmed.hassan@greenenergy.edu',
          linkedin: 'https://linkedin.com/in/ahmed-hassan-energy',
          avatar: '/avatars/ahmed.jpg',
          expertise: 'Energy Policy & Regulation'
        },
        {
          id: 'user5',
          name: 'Lisa Thompson',
          company: 'SolarShare Cooperative',
          role: 'Community Organizer',
          email: 'lisa@solarshare.coop',
          linkedin: 'https://linkedin.com/in/lisathompson-solar',
          avatar: '/avatars/lisa.jpg',
          expertise: 'Community Energy Projects'
        }
      ],
      nextSteps: [
        {
          id: 'step4',
          action: 'Map regulatory landscape across different states',
          deadline: '2024-02-28'
        },
        {
          id: 'step5',
          action: 'Interview existing community energy projects',
          deadline: '2024-03-15'
        }
      ]
    },
    {
      id: '3',
      title: 'Async Meeting Templates',
      description: 'Document and share async meeting best practices for distributed teams',
      priority: 'low',
      timeline: '2 months',
      collaborators: [
        {
          id: 'user6',
          name: 'David Park',
          company: 'RemoteWork Solutions',
          role: 'UX Designer',
          email: 'david.park@remotework.com',
          linkedin: 'https://linkedin.com/in/davidpark-ux',
          avatar: '/avatars/david.jpg',
          expertise: 'Remote Collaboration Tools'
        }
      ],
      nextSteps: [
        {
          id: 'step6',
          action: 'Create template library structure',
          deadline: '2024-01-20'
        },
        {
          id: 'step7',
          action: 'Test templates with 3 different teams',
          deadline: '2024-02-10'
        }
      ]
    }
  ]
}

function loadSampleSurveyData() {
  // Sample survey data showing sentiment about key topics
  surveyData.value = [
    {
      topic: 'AI Ethics Implementation',
      stronglyDisagree: 2,
      disagree: 3,
      neutral: 5,
      agree: 12,
      stronglyAgree: 8
    },
    {
      topic: 'Remote Work Future',
      stronglyDisagree: 1,
      disagree: 4,
      neutral: 8,
      agree: 15,
      stronglyAgree: 6
    },
    {
      topic: 'Climate Tech Funding',
      stronglyDisagree: 3,
      disagree: 2,
      neutral: 4,
      agree: 18,
      stronglyAgree: 12
    },
    {
      topic: 'Open Source Collaboration',
      stronglyDisagree: 0,
      disagree: 2,
      neutral: 6,
      agree: 16,
      stronglyAgree: 14
    },
    {
      topic: 'Regulation Balance',
      stronglyDisagree: 5,
      disagree: 8,
      neutral: 12,
      agree: 10,
      stronglyAgree: 3
    }
  ]

  surveyInsights.value = [
    {
      id: '1',
      type: 'positive',
      message: 'Strong consensus (79%) on need for Climate Tech funding initiatives'
    },
    {
      id: '2',
      type: 'positive',
      message: 'Open Source collaboration shows highest agreement (79%) among all topics'
    },
    {
      id: '3',
      type: 'neutral',
      message: 'Mixed opinions on regulation balance - needs further discussion'
    },
    {
      id: '4',
      type: 'positive',
      message: 'AI Ethics implementation has strong support (67% agree/strongly agree)'
    }
  ]
}

function loadSampleDiscussionData() {
  // Sample discussion frequency data
  topicDiscussionData.value = [
    {
      name: 'AI Ethics & Governance',
      value: 45,
      discussions: 12,
      people: 18,
      category: 'Technology',
      description: 'Deep discussions about responsible AI development and deployment'
    },
    {
      name: 'Climate Solutions',
      value: 38,
      discussions: 10,
      people: 15,
      category: 'Environment',
      description: 'Innovative approaches to climate change mitigation'
    },
    {
      name: 'Remote Work Evolution',
      value: 32,
      discussions: 8,
      people: 12,
      category: 'Future of Work',
      description: 'Best practices and tools for distributed teams'
    },
    {
      name: 'Open Source Collaboration',
      value: 28,
      discussions: 7,
      people: 14,
      category: 'Technology',
      description: 'Building sustainable open source communities'
    },
    {
      name: 'Digital Privacy',
      value: 25,
      discussions: 6,
      people: 10,
      category: 'Technology',
      description: 'Balancing convenience with privacy protection'
    },
    {
      name: 'Startup Funding',
      value: 22,
      discussions: 5,
      people: 8,
      category: 'Business',
      description: 'Alternative funding models and investor relations'
    },
    {
      name: 'Education Innovation',
      value: 20,
      discussions: 4,
      people: 9,
      category: 'Education',
      description: 'Transforming learning through technology'
    },
    {
      name: 'Healthcare Access',
      value: 18,
      discussions: 4,
      people: 7,
      category: 'Healthcare',
      description: 'Improving healthcare accessibility and affordability'
    },
    {
      name: 'Sustainable Cities',
      value: 15,
      discussions: 3,
      people: 6,
      category: 'Environment',
      description: 'Urban planning for environmental sustainability'
    },
    {
      name: 'Mental Health Tech',
      value: 12,
      discussions: 2,
      people: 5,
      category: 'Healthcare',
      description: 'Technology solutions for mental wellness'
    }
  ]

  discussionInsights.value = [
    {
      metric: 'Most Engaging Topic',
      value: 'AI Ethics (18 people)',
      icon: 'mdi-fire',
      color: 'error'
    },
    {
      metric: 'Total Discussions',
      value: topicDiscussionData.value.reduce((sum, topic) => sum + (topic.discussions || 0), 0),
      icon: 'mdi-chat-outline',
      color: 'primary'
    },
    {
      metric: 'People Involved',
      value: topicDiscussionData.value.reduce((sum, topic) => sum + (topic.people || 0), 0),
      icon: 'mdi-account-group',
      color: 'success'
    }
  ]
}

function showSnackbar(text: string, color: string = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Professional metrics for executive-level reporting
function loadProfessionalMetrics() {
  professionalMetrics.value = {
    participationROI: {
      timeInvested: 8, // hours
      businessValueGenerated: 247500, // dollars
      hourlyROI: 30937.50,
      description: 'Time investment generated significant returns through strategic connections and collaboration opportunities'
    },
    networkingEfficiency: {
      connectionsPerHour: 1.5,
      qualityScore: 87,
      industryBenchmark: 65,
      improvement: '+34% above industry standard',
      description: 'Highly efficient networking with above-average connection quality'
    },
    knowledgeCapture: {
      ideasGenerated: 8,
      actionableInsights: 6,
      implementationProbability: 75,
      potentialImpact: 'High',
      description: 'Strong idea generation with high implementation potential'
    },
    collaborationIndex: {
      activeProjects: 3,
      pendingOpportunities: 2,
      crossFunctionalConnections: 8,
      leadershipAlignment: 92,
      description: 'Multiple collaboration streams with strong leadership buy-in'
    },
    competitiveAdvantage: {
      uniqueInsights: 4,
      industryTrends: 3,
      firstMoverOpportunities: 2,
      marketIntelligence: 'High',
      description: 'Gained competitive intelligence and first-mover advantages'
    }
  }
}

// Executive insights for C-level reporting
function loadExecutiveInsights() {
  executiveInsights.value = {
    strategicRecommendations: [
      {
        priority: 'high',
        category: 'Innovation',
        insight: 'AI Ethics Framework Implementation',
        description: 'Industry leaders are prioritizing ethical AI frameworks. Recommend accelerating our responsible AI initiative to maintain competitive positioning.',
        timeframe: '3 months',
        businessImpact: '$500K+ revenue protection',
        confidence: 95
      },
      {
        priority: 'high',
        category: 'Partnership',
        insight: 'Cross-Industry Collaboration Opportunity',
        description: 'Identified 3 strategic partnership opportunities with complementary technology leaders that could accelerate market penetration.',
        timeframe: '6 months',
        businessImpact: '$1.2M+ revenue potential',
        confidence: 85
      },
      {
        priority: 'medium',
        category: 'Market Intelligence',
        insight: 'Emerging Technology Trend',
        description: 'Early signals indicate quantum computing applications will disrupt current approaches. Recommend exploratory investment.',
        timeframe: '12-18 months',
        businessImpact: 'Market positioning advantage',
        confidence: 70
      }
    ],
    riskMitigation: [
      {
        risk: 'Competitive Technology Gap',
        description: 'Competitors are advancing faster in ML infrastructure. Need to accelerate hiring and R&D investment.',
        severity: 'Medium',
        mitigationPlan: 'Fast-track technical hiring, strategic partnerships'
      },
      {
        risk: 'Regulatory Compliance',
        description: 'New AI governance regulations expected. Early preparation provides competitive advantage.',
        severity: 'High',
        mitigationPlan: 'Implement ethical AI framework, compliance training'
      }
    ],
    industryBenchmarks: {
      networkingEfficiency: {
        ourScore: 87,
        industryAverage: 65,
        topQuartile: 78,
        position: 'Top 10%'
      },
      collaborationRate: {
        ourScore: 75,
        industryAverage: 45,
        topQuartile: 62,
        position: 'Top 15%'
      },
      innovationIndex: {
        ourScore: 82,
        industryAverage: 58,
        topQuartile: 71,
        position: 'Top 20%'
      }
    },
    actionItems: [
      {
        priority: 'urgent',
        action: 'Schedule strategic partnership meetings',
        owner: 'Business Development',
        deadline: '2 weeks',
        businessValue: 'Revenue acceleration'
      },
      {
        priority: 'high',
        action: 'Initiate AI ethics framework development',
        owner: 'Product/Engineering',
        deadline: '1 month',
        businessValue: 'Risk mitigation & competitive advantage'
      },
      {
        priority: 'medium',
        action: 'Analyze quantum computing market opportunity',
        owner: 'Strategy Team',
        deadline: '3 months',
        businessValue: 'Future market positioning'
      }
    ]
  }
}

// Load data on mount
onMounted(() => {
  fetchRecap()
  loadSampleIdeaData() // Load sample idea data
  loadSampleSurveyData() // Load sample survey data
  loadSampleDiscussionData() // Load sample discussion data
  loadEnhancedJourneyData() // Load enhanced journey data
})

// Load enhanced journey data
function loadEnhancedJourneyData() {
  // Enhanced journey data with more detail
  journey.value = {
    activeMinutes: 127,
    peakEngagementTime: '2:30 PM - 3:15 PM',
    highlightMoments: 5,
    mostActivePhase: 'Topic Discussion & Voting',
    engagementStyle: 'Active Collaborator',
    collaborationPattern: 'Cross-Functional Team Player',
    keyContribution: 'Innovative Problem Solving',
    keyMoments: [
      {
        type: 'participation',
        title: 'Event Check-in',
        description: 'Joined the unconference and completed profile setup',
        details: 'Set up interests in AI Ethics, Climate Tech, and Remote Work',
        timestamp: '9:00 AM',
        count: 1,
        impact: 20,
        relatedTopics: ['Event Setup', 'Profile']
      },
      {
        type: 'topic_proposed',
        title: 'Proposed AI Ethics Topic',
        description: 'Submitted "AI Bias Detection in Hiring" for discussion',
        details: 'Topic gained significant traction with 12 initial votes',
        timestamp: '9:45 AM',
        count: 1,
        impact: 85,
        relatedTopics: ['AI Ethics', 'Bias Detection', 'HR Tech']
      },
      {
        type: 'voting',
        title: 'Active Voting Participation',
        description: 'Voted on 8 different topics across multiple categories',
        details: 'Helped prioritize the most important discussions for the day',
        timestamp: '10:15 AM',
        count: 8,
        impact: 65,
        relatedTopics: ['Topic Voting', 'Prioritization']
      },
      {
        type: 'discussion',
        title: 'Led Discussion Session',
        description: 'Facilitated 45-minute discussion on AI ethics',
        details: 'Engaged 15 participants in deep conversation about bias detection frameworks',
        timestamp: '11:00 AM',
        count: 1,
        impact: 92,
        relatedTopics: ['AI Ethics', 'Discussion Leadership', 'Framework Design']
      },
      {
        type: 'idea_generation',
        title: 'Generated Key Ideas',
        description: 'Contributed 3 innovative solutions during brainstorming',
        details: 'Ideas focused on automated bias detection and community-driven standards',
        timestamp: '1:30 PM',
        count: 3,
        impact: 78,
        relatedTopics: ['Innovation', 'Bias Detection', 'Community Standards']
      },
      {
        type: 'collaboration',
        title: 'Formed Project Team',
        description: 'Connected with 4 participants to continue work post-event',
        details: 'Established roles and timeline for open-source bias detection library',
        timestamp: '2:45 PM',
        count: 4,
        impact: 88,
        relatedTopics: ['Team Formation', 'Open Source', 'Project Planning']
      },
      {
        type: 'networking',
        title: 'Built New Connections',
        description: 'Made meaningful connections with 8 fellow participants',
        details: 'Exchanged contact information and identified collaboration opportunities',
        timestamp: '3:30 PM',
        count: 8,
        impact: 70,
        relatedTopics: ['Networking', 'Collaboration', 'Knowledge Sharing']
      },
      {
        type: 'achievement',
        title: 'Unlocked Achievements',
        description: 'Earned "Thought Leader" and "Connector" badges',
        details: 'Recognition for leading discussions and facilitating connections',
        timestamp: '4:00 PM',
        count: 2,
        impact: 95,
        relatedTopics: ['Recognition', 'Leadership', 'Community Impact']
      }
    ]
  }
}

// Load Network Visualization sample data
function loadNetworkVisualizationData() {
  networkData.value = {
    nodes: [
      { id: 'user', name: 'You', role: 'Your Position', type: 'user', qualityScore: 100, x: 400, y: 250 },
      { id: '1', name: 'Dr. Sarah Chen', role: 'AI Ethics Lead at TechCorp', type: 'connection', qualityScore: 92, category: 'professional', sharedTopics: ['AI Ethics', 'Bias Detection', 'Governance'], connectionStrength: 'strong', mutualConnections: 3, influenceScore: 87 },
      { id: '2', name: 'Marcus Rodriguez', role: 'CTO at InnovateLabs', type: 'connection', qualityScore: 88, category: 'professional', sharedTopics: ['ML Infrastructure', 'Team Leadership', 'Technology Strategy'], connectionStrength: 'medium', mutualConnections: 5, influenceScore: 92 },
      { id: '3', name: 'Lisa Thompson', role: 'Product Manager at DataFlow', type: 'connection', qualityScore: 79, category: 'professional', sharedTopics: ['Product Strategy', 'User Research', 'Market Analysis'], connectionStrength: 'medium', mutualConnections: 2, influenceScore: 74 },
      { id: '4', name: 'Alex Kim', role: 'Founder at StartupVenture', type: 'connection', qualityScore: 85, category: 'industry', sharedTopics: ['Entrepreneurship', 'Venture Capital', 'Innovation'], connectionStrength: 'strong', mutualConnections: 4, influenceScore: 89 },
      { id: '5', name: 'Jordan Walsh', role: 'Senior Data Scientist', type: 'connection', qualityScore: 67, category: 'professional', sharedTopics: ['Data Science', 'ML', 'Analytics'], connectionStrength: 'weak', mutualConnections: 1, influenceScore: 58 },
      { id: '6', name: 'Emily Park', role: 'Principal UX Designer', type: 'connection', qualityScore: 74, category: 'professional', sharedTopics: ['Design', 'UX Research', 'User Psychology'], connectionStrength: 'medium', mutualConnections: 3, influenceScore: 71 },
      { id: '7', name: 'David Brown', role: 'VP Engineering', type: 'connection', qualityScore: 91, category: 'professional', sharedTopics: ['Engineering Leadership', 'System Architecture', 'Team Building'], connectionStrength: 'strong', mutualConnections: 6, influenceScore: 94 },
      { id: '8', name: 'Maria Garcia', role: 'Research Lead at Innovation Lab', type: 'connection', qualityScore: 83, category: 'industry', sharedTopics: ['Research', 'Innovation', 'Technology Trends'], connectionStrength: 'medium', mutualConnections: 2, influenceScore: 81 },
      { id: '9', name: 'James Wilson', role: 'Business Development', type: 'connection', qualityScore: 72, category: 'professional', sharedTopics: ['Business Strategy', 'Partnerships'], connectionStrength: 'weak', mutualConnections: 1, influenceScore: 65 },
      { id: '10', name: 'Anna Schmidt', role: 'Technical Writer', type: 'connection', qualityScore: 61, category: 'professional', sharedTopics: ['Documentation', 'Technical Communication'], connectionStrength: 'weak', mutualConnections: 0, influenceScore: 52 }
    ],
    links: [
      { source: 'user', target: '1', strength: 92, type: 'direct' },
      { source: 'user', target: '2', strength: 88, type: 'direct' },
      { source: 'user', target: '3', strength: 79, type: 'direct' },
      { source: 'user', target: '4', strength: 85, type: 'direct' },
      { source: 'user', target: '5', strength: 67, type: 'direct' },
      { source: 'user', target: '6', strength: 74, type: 'direct' },
      { source: 'user', target: '7', strength: 91, type: 'direct' },
      { source: 'user', target: '8', strength: 83, type: 'direct' },
      { source: 'user', target: '9', strength: 72, type: 'direct' },
      { source: 'user', target: '10', strength: 61, type: 'direct' },
      // Mutual connections showing network clustering
      { source: '1', target: '2', strength: 45, type: 'mutual' },
      { source: '2', target: '7', strength: 67, type: 'mutual' },
      { source: '3', target: '6', strength: 52, type: 'mutual' },
      { source: '4', target: '8', strength: 38, type: 'mutual' },
      { source: '1', target: '8', strength: 41, type: 'mutual' },
      { source: '7', target: '2', strength: 73, type: 'mutual' },
      { source: '6', target: '5', strength: 29, type: 'mutual' },
      { source: '4', target: '9', strength: 34, type: 'mutual' }
    ]
  }
}

// Load Strategic Connections sample data
// Enhanced Strategic Connections with AI-powered intelligence
function loadStrategicConnectionsData() {
  // Sample connection data with enhanced intelligence metrics
  const rawConnections = [
    {
      id: 'conn1',
      name: 'Dr. Sarah Chen',
      role: 'AI Ethics Lead at TechCorp',
      company: 'TechCorp',
      industry: 'Technology',
      companySize: 'large',
      title: 'AI Ethics Lead',
      sharedInterests: ['AI Ethics', 'Bias Detection', 'Governance', 'Machine Learning', 'Policy Development'],
      conversationTopics: 'Discussed comprehensive AI governance frameworks, bias detection methodologies in ML models, industry collaboration standards, and potential joint research opportunities on ethical AI implementation in healthcare.',
      mutualGoals: ['Open-source standards', 'Industry collaboration', 'Ethical AI development'],
      contactExchanged: true,
      followUpPlanned: true,
      followUpStatus: 'in_progress',
      collaborationDiscussed: true,
      topicsDiscussed: 4,
      questionsAsked: 3,
      resourcesShared: 2,
      collaborationProposed: true,
      lastContact: '2024-01-15',
      nextFollowUp: '2024-01-22',
      professionalAlignment: { score: 88 },
      collaborationPotential: { score: 92 }
    },
    {
      id: 'conn2',
      name: 'Marcus Rodriguez',
      role: 'CTO at InnovateLabs',
      company: 'InnovateLabs',
      industry: 'Technology',
      companySize: 'medium',
      title: 'CTO',
      sharedInterests: ['ML Infrastructure', 'Team Leadership', 'Technical Architecture', 'Scaling'],
      conversationTopics: 'Deep technical discussion on ML infrastructure scaling, team management strategies, and technical architecture decisions for high-growth environments.',
      mutualGoals: ['Technical best practices', 'Team scaling', 'Infrastructure optimization'],
      contactExchanged: true,
      followUpPlanned: false,
      followUpStatus: 'pending',
      collaborationDiscussed: true,
      topicsDiscussed: 3,
      questionsAsked: 2,
      resourcesShared: 1,
      collaborationProposed: false,
      lastContact: '2024-01-10',
      nextFollowUp: '2024-01-17',
      professionalAlignment: { score: 85 },
      collaborationPotential: { score: 80 }
    },
    {
      id: 'conn3',
      name: 'Lisa Thompson',
      role: 'Product Manager at DataFlow',
      company: 'DataFlow',
      industry: 'Technology',
      companySize: 'enterprise',
      title: 'Senior Product Manager',
      sharedInterests: ['Product Strategy', 'User Research', 'Data-Driven Decisions'],
      conversationTopics: 'Explored user-centered product development methodologies, data analytics for product decisions, and cross-functional collaboration strategies.',
      mutualGoals: ['User-centric design', 'Market insights', 'Product excellence'],
      contactExchanged: true,
      followUpPlanned: true,
      followUpStatus: 'completed',
      collaborationDiscussed: false,
      topicsDiscussed: 2,
      questionsAsked: 2,
      resourcesShared: 1,
      collaborationProposed: false,
      lastContact: '2024-01-12',
      nextFollowUp: null,
      professionalAlignment: { score: 72 },
      collaborationPotential: { score: 65 }
    },
    {
      id: 'conn4',
      name: 'Alex Kim',
      role: 'Founder at StartupVenture',
      company: 'StartupVenture',
      industry: 'Technology',
      companySize: 'startup',
      title: 'Founder & CEO',
      sharedInterests: ['Entrepreneurship', 'Venture Capital', 'Startup Growth', 'Innovation'],
      conversationTopics: 'Discussed startup scaling strategies, venture capital landscape, and innovative approaches to market penetration and customer acquisition.',
      mutualGoals: ['Startup growth', 'Funding strategies', 'Innovation acceleration'],
      contactExchanged: true,
      followUpPlanned: false,
      followUpStatus: 'pending',
      collaborationDiscussed: true,
      topicsDiscussed: 3,
      questionsAsked: 4,
      resourcesShared: 2,
      collaborationProposed: true,
      lastContact: '2024-01-08',
      nextFollowUp: '2024-01-18',
      professionalAlignment: { score: 78 },
      collaborationPotential: { score: 88 }
    }
  ]

  // Apply connection intelligence to each connection
  const intelligentConnections = rawConnections.map(conn => {
    const qualityAnalysis = calculateConnectionQuality(conn)
    const strengthAnalysis = calculateConnectionStrength(conn)
    const followUpRecs = generateFollowUpRecommendations(conn, qualityAnalysis.overallScore)

    return {
      ...conn,
      qualityScore: qualityAnalysis.overallScore,
      qualityFactors: qualityAnalysis.factors,
      businessValue: qualityAnalysis.businessValue,
      connectionStrength: strengthAnalysis.strength,
      strengthScore: strengthAnalysis.score,
      followUpRecommendations: followUpRecs,
      priorityLevel: qualityAnalysis.priorityLevel,
      recommendation: qualityAnalysis.recommendation
    }
  })

  // Analyze overall network health
  const networkHealth = analyzeNetworkHealth(intelligentConnections)

  strategicConnections.value = {
    total: intelligentConnections.length,
    highValue: intelligentConnections.filter(c => c.qualityScore >= 80).length,
    followUpPending: intelligentConnections.filter(c => c.followUpStatus === 'pending').length,
    avgQualityScore: networkHealth.averageQuality,
    businessValue: `Connected with ${intelligentConnections.length} strategic professionals, generating $${Math.round(networkHealth.businessValue.total / 1000)}K+ in identified business value. ${networkHealth.qualityDistribution.high} high-quality connections established with strong collaboration potential and ${intelligentConnections.filter(c => c.followUpRecommendations?.length > 0).length} active follow-up opportunities for strategic partnerships and knowledge exchange.`,
    topConnections: intelligentConnections.sort((a, b) => b.qualityScore - a.qualityScore),
    networkInsights: networkHealth.insights,
    qualityDistribution: networkHealth.qualityDistribution,
    strengthDistribution: networkHealth.strengthDistribution,
    totalBusinessValue: networkHealth.businessValue.total
  }
}

// Initialize data on component mount
onMounted(async () => {
  // Load sample data for demo
  loadStrategicConnectionsData()
  loadNetworkVisualizationData()
  loadSampleIdeaData()
  loadSampleSurveyData()
  loadSampleDiscussionData()
  loadEnhancedJourneyData()
  loadProfessionalMetrics()
  loadExecutiveInsights()

  // Set sample personal impact data
  personalImpact.value = {
    overallImpact: 87,
    contributionScore: 92,
    networkingScore: 78,
    collaborationScore: 85
  }

  // Set sample event data
  event.value = {
    title: 'AI & Future of Work Summit 2025',
    date: '2024-01-10'
  }

  // Set sample metrics
  metrics.value = {
    activeProjects: 3,
    newConnections: 12,
    ideasGenerated: 8,
    activeMinutes: 127,
    businessImpact: 'High'
  }
})
</script>

<style scoped>
.personal-recap-card {
  border-radius: 16px;
  overflow: hidden;
}

.recap-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 32px;
  min-height: 200px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
}

/* View Mode Selector Styles */
.view-selector {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.view-toggle {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.view-btn {
  color: white !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.view-btn.v-btn--active {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Executive Summary Styles */
.executive-summary-card {
  border-radius: 12px;
  border-left: 4px solid #1976d2;
}

.metric-card {
  padding: 16px;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(25, 118, 210, 0.1);
}

/* Strategic Connections Styles */
.strategic-connections-card {
  border-radius: 12px;
  border-left: 4px solid #4caf50;
}

.connection-metric {
  padding: 12px;
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.connection-card {
  transition: all 0.2s ease;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.connection-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: rgba(76, 175, 80, 0.3);
}

/* Professional View Enhancements */
.commitment-priority-card {
  border-radius: 12px;
  border-left: 4px solid #2196f3;
}

/* Professional Sharing Styles */
.professional-share-grid {
  max-width: 100%;
}

.professional-share-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.professional-share-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.linkedin-card {
  background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
}

.email-card {
  background: linear-gradient(135deg, #ea4335 0%, #d33b2c 100%);
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-emoji {
  line-height: 1;
}

.insight-card {
  border-radius: 12px;
}

.connection-card {
  border-radius: 12px;
  transition: all 0.2s;
}

.connection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.achievement-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
}

/* Social media logo grid styles (for personal view) */
.social-logos-grid {
  max-width: 100%;
}

.social-logo-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.social-logo-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.twitter-card {
  background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
}

.copy-card {
  background: linear-gradient(135deg, #6c5ce7 0%, #5a4fcf 100%);
}

.share-text-preview {
  background: #f8f9fa;
}

/* Enhanced Journey Timeline Styles */
.journey-timeline {
  margin-top: 20px;
}

.timeline-moment {
  margin-bottom: 16px;
}

.timeline-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.timeline-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.topic_proposed-card {
  border-left: 4px solid #1976d2;
}

.voting-card {
  border-left: 4px solid #4caf50;
}

.participation-card {
  border-left: 4px solid #ff9800;
}

.collaboration-card {
  border-left: 4px solid #2196f3;
}

.idea_generation-card {
  border-left: 4px solid #9c27b0;
}

.networking-card {
  border-left: 4px solid #e91e63;
}

.discussion-card {
  border-left: 4px solid #009688;
}

.achievement-card {
  border-left: 4px solid #ff5722;
}

/* Expansion panels for commitments */
.v-expansion-panel {
  border-radius: 8px !important;
}

.v-expansion-panel::before {
  box-shadow: none;
}

/* Enhanced existing styles */
.share-section {
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

/* New styles for ideas and insights sections */
.idea-preview-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.idea-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.topic-ranking-item {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.topic-ranking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gold-ranking {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: 2px solid #ffd700;
}

.silver-ranking {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  border: 2px solid #c0c0c0;
}

.bronze-ranking {
  background: linear-gradient(135deg, #cd7f32 0%, #deb887 100%);
  border: 2px solid #cd7f32;
}

.regular-ranking {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.ranking-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #333;
}

.share-text-field {
  background: rgba(255, 255, 255, 0.1);
}

.share-text-field :deep(.v-input__slot) {
  background: rgba(255, 255, 255, 0.9);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .professional-share-card {
    min-height: 120px;
  }
  
  .social-logo-card {
    min-height: 150px;
  }
  
  .view-btn {
    font-size: 0.875rem;
  }
}
</style>