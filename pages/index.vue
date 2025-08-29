<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

// Data
const router = useRouter()
const eventCode = ref('')
const { siteConfig } = useSiteConfig()

// SEO Meta tags
useSeoMeta({
  title: `${siteConfig.title} - ${siteConfig.tagline}`,
  description: siteConfig.description,
  ogTitle: `${siteConfig.title} - ${siteConfig.tagline}`,
  ogDescription: siteConfig.description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: `${siteConfig.title} - ${siteConfig.tagline}`,
  twitterDescription: siteConfig.description
})

const processSteps = [
  {
    title: 'Propose Topics',
    description: 'Share your ideas and interests with the group',
    icon: 'mdi-lightbulb',
    color: 'primary'
  },
  {
    title: 'Vote on Interests',
    description: 'Express preferences to shape the discussion agenda',
    icon: 'mdi-vote',
    color: 'secondary'
  },
  {
    title: 'Join Discussions',
    description: 'Participate in focused small-group conversations',
    icon: 'mdi-account-group',
    color: 'success'
  },
  {
    title: 'Share Knowledge',
    description: 'Learn from others and contribute your expertise',
    icon: 'mdi-share-variant',
    color: 'info'
  }
]

const joinMethods = [
  {
    title: 'Scan QR Code',
    description: 'At the event venue, look for QR codes on screens or posters',
    icon: 'mdi-qrcode-scan',
    color: 'primary'
  },
  {
    title: 'Enter Event Code',
    description: 'Use the event code provided by organizers (e.g., "DEMO2024")',
    icon: 'mdi-form-textbox',
    color: 'secondary'
  },
  {
    title: 'Follow Link',
    description: 'Click invitation links shared by event organizers',
    icon: 'mdi-link',
    color: 'success'
  }
]

const demoEvent = {
  id: 'demo-organizer-2024',
  title: 'Try Organizing an Unconference',
  description: 'Experience the full organizer workflow: set up your event, invite participants, facilitate session planning, and manage collaborative agenda-building.',
  time: 'Interactive Demo - Start Anytime',
  participants: 127,
  location: 'Organizer Dashboard',
  status: 'demo',
  statusText: 'Start Demo',
  statusIcon: 'mdi-play-circle'
}

const testimonials = [
  {
    id: 1,
    text: "The best conference format I've experienced. Being able to shape the agenda made discussions so much more relevant to what I actually wanted to learn.",
    name: "Sarah Chen",
    role: "Product Manager, TechCorp",
    color: "primary"
  },
  {
    id: 2,
    text: "Unlike traditional conferences where you sit passively, unconferences get you actively participating. I made connections that led to real collaboration.",
    name: "Marcus Rodriguez",
    role: "Software Engineer, StartupXYZ",
    color: "success"
  },
  {
    id: 3,
    text: "As an organizer, I love how this platform handles everything seamlessly. Participants are more engaged, and the discussions are incredibly rich.",
    name: "Dr. Priya Patel",
    role: "Research Director, Innovation Lab",
    color: "info"
  }
]

const stats = [
  {
    number: "10,000+",
    label: "Participants",
    icon: "mdi-account-group",
    color: "primary"
  },
  {
    number: "500+",
    label: "Events Hosted",
    icon: "mdi-calendar-check",
    color: "success"
  },
  {
    number: "50+",
    label: "Countries",
    icon: "mdi-earth",
    color: "info"
  },
  {
    number: "95%",
    label: "Satisfaction Rate",
    icon: "mdi-heart",
    color: "error"
  }
]

const faqs = [
  {
    id: 1,
    question: "What exactly is an unconference?",
    answer: "An unconference is a participant-driven meeting where the agenda is created by the attendees at the beginning of the event. Unlike traditional conferences with predetermined speakers and topics, unconferences allow participants to propose topics, vote on what interests them most, and lead discussions themselves.",
    icon: "mdi-help-circle"
  },
  {
    id: 2,
    question: "Do I need any special skills to participate?",
    answer: "Not at all! Unconferences are designed for everyone, regardless of experience level. The beauty is that everyone has something valuable to contribute, whether it's asking great questions, sharing experiences, or offering different perspectives. Your curiosity and willingness to engage are all you need.",
    icon: "mdi-account-school"
  },
  {
    id: 3,
    question: "How do I join an event?",
    answer: "You can join events in three ways: scan a QR code at the venue, enter an event code provided by organizers (like 'DEMO2024'), or click invitation links shared by event hosts. For virtual events, you'll receive a direct link to join the online discussions.",
    icon: "mdi-login"
  },
  {
    id: 4,
    question: "What if I'm too shy to lead a discussion?",
    answer: "That's perfectly fine! You can participate by voting on topics, asking questions, and contributing to discussions led by others. Many participants prefer to listen and learn, and that's equally valuable. You can always propose a topic as a question you'd like to explore with others.",
    icon: "mdi-account-voice"
  },
  {
    id: 5,
    question: "How long do unconferences typically last?",
    answer: "Unconferences can range from a few hours to multiple days, depending on the organizer's goals. Most single-day events run 4-8 hours with multiple discussion rounds. The platform handles the timing and transitions automatically, so you can focus on the conversations.",
    icon: "mdi-clock"
  },
  {
    id: 6,
    question: "Can I organize my own unconference?",
    answer: "Absolutely! Our platform makes it easy to create and manage your own unconference. You can set it up in minutes, customize the experience, and invite participants. We provide all the tools you need, from topic collection to group formation and room assignments.",
    icon: "mdi-account-plus"
  }
]

function joinEvent(event: any) {
  if (event.status === 'demo') {
    navigateTo('/organizer')
  } else {
    navigateTo('/quick-join')
  }
}

function quickJoinWithCode() {
  if (eventCode.value && eventCode.value.length >= 3) {
    navigateTo(`/quick-join?code=${eventCode.value}`)
  }
}

function shareEvent(event: any) {
  // Implement sharing functionality
  console.log('Sharing event:', event)
}
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container class="py-16">
        <v-row align="center" justify="center">
          <v-col cols="12" lg="10" xl="8" class="text-center">
            <div class="hero-content" role="main">
              <h1 class="hero-title mb-6" id="main-heading">
                {{ siteConfig.tagline }}
              </h1>
              <p class="hero-subtitle mb-8" aria-describedby="main-heading">
                {{ siteConfig.description }}
                <br>
                <strong>Try organizing your own</strong> to see how it works, or <strong>join an active event</strong> right now.
              </p>
              
              <div class="hero-actions mb-8">
                <div class="action-row primary-actions">
                  <v-btn
                    color="primary"
                    size="x-large"
                    prepend-icon="mdi-play"
                    @click="joinEvent(demoEvent)"
                    class="hero-btn-primary"
                    elevation="8"
                  >
                    Try Organizing
                  </v-btn>
                  
                  <v-btn
                    color="secondary"
                    size="x-large"
                    prepend-icon="mdi-ticket-confirmation"
                    to="/quick-join"
                    class="hero-btn-secondary"
                    elevation="6"
                  >
                    Join Event
                  </v-btn>
                </div>
                
                <div class="action-row secondary-actions mt-4">
                  <v-btn
                    variant="text"
                    size="large"
                    prepend-icon="mdi-plus"
                    to="/register"
                    class="hero-btn-text"
                  >
                    Create Event
                  </v-btn>
                  
                  <v-btn
                    variant="text"
                    size="large"
                    prepend-icon="mdi-login"
                    to="/login"
                    class="hero-btn-text"
                  >
                    Sign In
                  </v-btn>
                </div>
              </div>
              
              <div class="quick-join-section mt-8 mb-6">
                <p class="quick-join-label">Have an event code? Join instantly:</p>
                <v-form class="quick-join-form" @submit.prevent="quickJoinWithCode">
                  <div class="input-group">
                    <v-text-field
                      v-model="eventCode"
                      placeholder="Enter event code (e.g., DEMO2024)"
                      variant="outlined"
                      class="event-code-input"
                      density="comfortable"
                      hide-details
                    />
                    <v-btn
                      type="submit"
                      color="success"
                      size="large"
                      class="join-btn"
                      :disabled="!eventCode || eventCode.length < 3"
                    >
                      Join
                    </v-btn>
                  </div>
                </v-form>
              </div>
              
              <p class="hero-note">
                Or explore without commitment - try our interactive organizer demo below
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Demo Event Section -->
    <section class="featured-section">
      <v-container class="py-16">
        <div class="section-header">
          <div class="section-icon">
            <v-icon size="64" color="primary">mdi-play-circle</v-icon>
          </div>
          <h2 class="section-title">Try Our Interactive Demo</h2>
          <p class="section-subtitle">
            Experience how unconferences work with our live demo event - no registration required
          </p>
        </div>
        
        <v-row class="event-grid justify-center">
          <v-col cols="12" md="8" lg="6">
            <v-card 
              class="event-card event-card--demo" 
              elevation="8"
              @click="joinEvent(demoEvent)"
            >
              <div class="event-image demo-image">
                <div class="demo-visual">
                  <v-icon size="80" color="primary" class="demo-icon">mdi-play-circle</v-icon>
                  <div class="demo-particles">
                    <div class="particle" v-for="i in 6" :key="i"></div>
                  </div>
                </div>
                <div class="event-status">
                  <v-chip
                    color="success"
                    class="event-chip demo-chip"
                    size="large"
                  >
                    <v-icon start>{{ demoEvent.statusIcon }}</v-icon>
                    {{ demoEvent.statusText }}
                  </v-chip>
                </div>
              </div>
              
              <div class="event-content">
                <h3 class="event-title">{{ demoEvent.title }}</h3>
                <p class="event-description">{{ demoEvent.description }}</p>
                
                <div class="event-meta">
                  <div class="meta-item">
                    <v-icon size="18">mdi-clock</v-icon>
                    <span>{{ demoEvent.time }}</span>
                  </div>
                  <div class="meta-item">
                    <v-icon size="18">mdi-account-group</v-icon>
                    <span>{{ demoEvent.participants }} participants</span>
                  </div>
                  <div class="meta-item">
                    <v-icon size="18">mdi-earth</v-icon>
                    <span>{{ demoEvent.location }}</span>
                  </div>
                </div>
              </div>
              
              <v-card-actions class="event-actions">
                <v-btn
                  color="success"
                  variant="flat"
                  block
                  size="x-large"
                  prepend-icon="mdi-play"
                  class="demo-btn"
                >
                  Try Interactive Demo
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        
        <div class="text-center mt-8">
          <p class="demo-note">
            <v-icon color="info" class="mr-1">mdi-information</v-icon>
            No registration required - jump right in and explore the unconference experience
          </p>
        </div>
      </v-container>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section">
      <v-container class="py-16">
        <div class="section-header">
          <div class="section-icon">
            <v-icon size="64" color="primary">mdi-format-quote-open</v-icon>
          </div>
          <h2 class="section-title">What Participants Say</h2>
          <p class="section-subtitle">
            Real feedback from unconference participants worldwide
          </p>
        </div>
        
        <v-row class="mt-12">
          <v-col cols="12" md="4" v-for="testimonial in testimonials" :key="testimonial.id">
            <v-card class="testimonial-card" elevation="6">
              <v-card-text class="testimonial-content">
                <v-icon class="testimonial-quote" color="primary">mdi-format-quote-open</v-icon>
                <p class="testimonial-text">{{ testimonial.text }}</p>
                
                <div class="testimonial-author">
                  <v-avatar size="48" class="testimonial-avatar" :color="testimonial.color || 'primary'">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                  <div class="author-info">
                    <h4 class="author-name">{{ testimonial.name }}</h4>
                    <p class="author-role">{{ testimonial.role }}</p>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <div class="stats-row mt-16">
          <v-row>
            <v-col cols="6" md="3" v-for="stat in stats" :key="stat.label">
              <div class="stat-item">
                <v-icon :color="stat.color" size="40" class="stat-icon">{{ stat.icon }}</v-icon>
                <h3 class="stat-number">{{ stat.number }}</h3>
                <p class="stat-label">{{ stat.label }}</p>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </section>

    <!-- How it Works Section -->
    <section id="how-it-works" class="how-it-works-section">
      <v-container class="py-16">
        <div class="section-header">
          <div class="section-icon">
            <v-icon size="64" color="primary">mdi-help-circle</v-icon>
          </div>
          <h2 class="section-title">How Unconferences Work</h2>
          <p class="section-subtitle">
            Participant-driven events where <strong>you</strong> shape the agenda
          </p>
        </div>
        
        <v-row class="mt-12">
          <v-col cols="12" lg="6">
            <div class="process-steps">
              <div class="process-step" v-for="(step, index) in processSteps" :key="index">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <v-icon :color="step.color" size="40" class="step-icon">{{ step.icon }}</v-icon>
                  <h3 class="step-title">{{ step.title }}</h3>
                  <p class="step-description">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" lg="6">
            <v-card class="join-info-card" elevation="8">
              <v-card-title class="join-info-header">
                <v-icon class="mr-2">mdi-ticket-confirmation</v-icon>
                3 Ways to Join Events
              </v-card-title>
              
              <v-card-text class="join-methods">
                <div class="join-method" v-for="method in joinMethods" :key="method.title">
                  <div class="method-icon">
                    <v-icon :color="method.color" size="32">{{ method.icon }}</v-icon>
                  </div>
                  <div class="method-content">
                    <h4 class="method-title">{{ method.title }}</h4>
                    <p class="method-description">{{ method.description }}</p>
                  </div>
                </div>
              </v-card-text>
              
              <v-card-actions class="pa-6">
                <v-btn
                  color="primary"
                  size="large"
                  prepend-icon="mdi-ticket-confirmation"
                  to="/quick-join"
                  block
                  elevation="2"
                >
                  Join an Event Now
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <v-container class="py-16">
        <div class="section-header">
          <div class="section-icon">
            <v-icon size="64" color="primary">mdi-frequently-asked-questions</v-icon>
          </div>
          <h2 class="section-title">Frequently Asked Questions</h2>
          <p class="section-subtitle">
            Everything you need to know about unconferences
          </p>
        </div>
        
        <v-row class="mt-12">
          <v-col cols="12" lg="8" class="mx-auto">
            <v-expansion-panels
              variant="accordion"
              multiple
              class="faq-panels"
            >
              <v-expansion-panel
                v-for="faq in faqs"
                :key="faq.id"
                class="faq-panel"
              >
                <v-expansion-panel-title class="faq-question">
                  <v-icon class="mr-3" color="primary">{{ faq.icon }}</v-icon>
                  {{ faq.question }}
                </v-expansion-panel-title>
                <v-expansion-panel-text class="faq-answer">
                  {{ faq.answer }}
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
        
        <div class="text-center mt-12">
          <p class="faq-contact">
            Still have questions? 
            <a href="mailto:support@unconference.app" class="faq-link">Contact our support team</a>
          </p>
        </div>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
  color: white;
  position: relative;
  overflow: hidden;
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white"><polygon points="0,0 1000,80 1000,100 0,100"/></svg>') no-repeat bottom;
  background-size: cover;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  text-shadow: 0 4px 12px rgba(0,0,0,0.15);
  background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
}

.hero-subtitle {
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  line-height: 1.6;
  opacity: 0.95;
  max-width: 800px;
  margin: 0 auto 3rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.hero-actions {
  margin-bottom: 2rem;
}

.action-row {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-actions .v-btn {
  min-width: 180px;
}

.secondary-actions .v-btn {
  min-width: 140px;
}

.hero-btn-primary {
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.3px;
  text-transform: none;
  padding: 16px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  color: #6366F1 !important;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.2);
}

.hero-btn-secondary {
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.3px;
  text-transform: none;
  padding: 16px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
  color: white !important;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(139, 92, 246, 0.4);
}

.hero-btn-outline {
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  font-weight: 500;
  font-size: 1rem;
  text-transform: none;
  padding: 14px 28px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn-outline:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-1px);
}

.hero-btn-text {
  color: rgba(255,255,255,0.9);
  font-weight: 500;
  text-transform: none;
  transition: all 0.3s ease;
}

.hero-btn-text:hover {
  color: white;
  background: rgba(255,255,255,0.1);
}

.hero-btn-secondary:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-1px);
}

.hero-note {
  color: rgba(255,255,255,0.85);
  font-size: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-join-section {
  max-width: 500px;
  margin: 0 auto;
}

.quick-join-label {
  color: rgba(255,255,255,0.9);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-join-form {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.2);
}

.input-group {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.event-code-input {
  flex: 1;
}

.event-code-input :deep(.v-field) {
  background: rgba(255,255,255,0.95);
  border-radius: 12px;
}

.event-code-input :deep(.v-field__input) {
  font-weight: 500;
  font-size: 1.1rem;
}

.join-btn {
  font-weight: 600;
  font-size: 1rem;
  text-transform: none;
  border-radius: 12px;
  min-width: 100px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

/* Section Headers */
.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-icon {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: rgb(var(--v-theme-on-surface));
  background: linear-gradient(135deg, #1E293B 0%, #6366F1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.section-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  color: rgb(var(--v-theme-on-surface-variant));
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
  font-weight: 400;
}

/* Featured Events */
.featured-section {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  padding: 5rem 0;
}

.event-grid {
  margin-top: 3rem;
}

.event-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  position: relative;
}

.event-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(0,0,0,0.15), 
    0 0 0 1px rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255,255,255,0.6);
}

.event-card--active {
  border: 2px solid #10B981;
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
}

.event-card--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%);
  pointer-events: none;
}

.event-card--demo {
  border: 2px solid #10B981;
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
  transform: scale(1.02);
  cursor: pointer;
}

.event-card--demo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%);
  pointer-events: none;
}

.event-card--demo:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 
    0 30px 60px rgba(16, 185, 129, 0.25), 
    0 0 0 1px rgba(16, 185, 129, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.8);
}

.demo-chip {
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0 12px;
}

.demo-btn {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
}

.demo-note {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 1rem;
  font-style: italic;
  opacity: 0.9;
}

.demo-image {
  height: 250px;
  position: relative;
}

.demo-visual {
  height: 100%;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.demo-visual::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
}

.demo-icon {
  z-index: 2;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  animation: float 3s ease-in-out infinite;
}

.demo-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: float-particle 4s ease-in-out infinite;
}

.particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { top: 60%; left: 20%; animation-delay: 0.5s; }
.particle:nth-child(3) { top: 30%; left: 80%; animation-delay: 1s; }
.particle:nth-child(4) { top: 70%; left: 70%; animation-delay: 1.5s; }
.particle:nth-child(5) { top: 40%; left: 30%; animation-delay: 2s; }
.particle:nth-child(6) { top: 80%; left: 50%; animation-delay: 2.5s; }

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0px);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-20px);
    opacity: 1;
  }
}

.event-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
}

/* Testimonials Section */
.testimonials-section {
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
  padding: 6rem 0;
  position: relative;
}

.testimonials-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 15% 25%, rgba(99, 102, 241, 0.03) 0%, transparent 25%),
    radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.03) 0%, transparent 25%);
  pointer-events: none;
}

.testimonial-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  position: relative;
  overflow: hidden;
}

.testimonial-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

.testimonial-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  border-color: rgba(99, 102, 241, 0.2);
}

.testimonial-content {
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.testimonial-quote {
  font-size: 2rem;
  opacity: 0.6;
  margin-bottom: 1rem;
}

.testimonial-text {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #374151;
  font-style: italic;
  margin-bottom: 2rem;
  flex-grow: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
}

.testimonial-avatar {
  border: 3px solid #F1F5F9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.author-info {
  flex: 1;
}

.author-name {
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.author-role {
  color: #6B7280;
  font-size: 0.9rem;
  margin: 0;
}

.stats-row {
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 3rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.08);
  border-color: rgba(99, 102, 241, 0.15);
}

.stat-icon {
  margin-bottom: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #1E293B 0%, #6366F1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.stat-label {
  color: #6B7280;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* FAQ Section */
.faq-section {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  padding: 6rem 0;
  position: relative;
}

.faq-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.03) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.03) 0%, transparent 30%);
  pointer-events: none;
}

.faq-panels {
  box-shadow: none;
}

.faq-panel {
  border-radius: 16px !important;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%) !important;
  border: 1px solid rgba(148, 163, 184, 0.1) !important;
  margin-bottom: 1rem !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.08) !important;
  border-color: rgba(99, 102, 241, 0.15) !important;
}

.faq-question {
  font-weight: 600 !important;
  font-size: 1.1rem !important;
  color: #1F2937 !important;
  padding: 1.5rem 2rem !important;
  background: transparent !important;
}

.faq-answer {
  padding: 0 2rem 2rem 2rem !important;
  color: #4B5563 !important;
  line-height: 1.7 !important;
  font-size: 1rem !important;
}

.faq-contact {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 1.1rem;
  margin-top: 2rem;
}

.faq-link {
  color: #6366F1;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}

.faq-link:hover {
  color: #4F46E5;
  border-bottom-color: rgba(79, 70, 229, 0.6);
}

.event-image {
  position: relative;
}

.event-status {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.event-chip {
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  font-weight: 600;
  border-radius: 12px;
}

.event-title {
  font-size: 1.4rem;
  font-weight: 700;
  padding: 1.5rem 1.5rem 0.5rem;
  color: #1E293B;
  line-height: 1.3;
}

.event-content {
  padding: 0 1.5rem 1.5rem;
}

.event-description {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: #64748B;
  font-size: 0.95rem;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #64748B;
  font-weight: 500;
}

.meta-item .v-icon {
  color: #6366F1 !important;
}

.event-actions {
  padding: 0 1.5rem 1.5rem;
}

.event-actions .v-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
}

/* How It Works */
.how-it-works-section {
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
  padding: 6rem 0;
  position: relative;
}

.how-it-works-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 20%);
  pointer-events: none;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  position: relative;
  padding: 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.process-step:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  border-color: rgba(99, 102, 241, 0.2);
}

.step-number {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.3rem;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  position: relative;
}

.step-number::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
}

.step-content {
  flex: 1;
}

.step-icon {
  margin-bottom: 1rem;
  color: #6366F1 !important;
}

.step-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #1E293B;
  line-height: 1.3;
}

.step-description {
  color: #64748B;
  line-height: 1.6;
  font-size: 1rem;
}

.join-info-card {
  border-radius: 24px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  overflow: hidden;
  position: relative;
}

.join-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

.join-info-header {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  color: white;
  border-radius: 0;
  font-size: 1.3rem;
  font-weight: 700;
  padding: 2rem;
  position: relative;
}

.join-info-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
}

.join-methods {
  padding: 2rem;
}

.join-method {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.join-method:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.08);
  border-color: rgba(99, 102, 241, 0.15);
}

.join-method:last-child {
  margin-bottom: 0;
}

.method-icon {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.method-content {
  flex: 1;
}

.method-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1E293B;
  line-height: 1.3;
}

.method-description {
  color: #64748B;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
  position: relative;
  padding: 6rem 0;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
}

.cta-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(20px);
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.cta-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

.cta-content {
  text-align: center;
  padding: 4rem 3rem;
  color: white;
  position: relative;
}

.cta-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
  background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.cta-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.6;
  color: #CBD5E1;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 3rem;
}

.cta-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.cta-btn-primary {
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: none;
  border-radius: 16px;
  padding: 18px 36px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
  color: #1E293B !important;
  box-shadow: 0 12px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cta-btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  transition: left 0.5s;
}

.cta-btn-primary:hover::before {
  left: 100%;
}

.cta-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8);
}

.cta-btn-secondary {
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  font-weight: 600;
  font-size: 1rem;
  text-transform: none;
  border-radius: 16px;
  padding: 16px 32px;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-btn-secondary:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.cta-note {
  color: rgba(255,255,255,0.8);
  font-size: 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.cta-link {
  color: #60A5FA;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  transition: all 0.3s ease;
}

.cta-link:hover {
  color: #93C5FD;
  border-bottom-color: rgba(147, 197, 253, 0.6);
}

/* General Styles */
.landing-page {
  min-height: 100vh;
  background: #FEFEFE;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Enhanced focus states for accessibility */
.v-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #F1F5F9;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
}

/* Responsive Design */
@media (max-width: 960px) {
  .section-title {
    font-size: clamp(1.8rem, 4vw, 2.5rem);
  }
  
  .cta-title {
    font-size: clamp(1.8rem, 4vw, 2.5rem);
  }
  
  .process-step {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .join-method {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1.25rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .hero-btn-primary,
  .hero-btn-secondary {
    min-width: 280px;
    min-height: 48px;
  }
  
  .quick-join-form {
    padding: 1.25rem;
  }
  
  .input-group {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .join-btn {
    width: 100%;
    min-height: 48px;
  }
  
  .testimonial-content {
    padding: 2rem 1.5rem;
  }
  
  .faq-question {
    padding: 1.25rem 1.5rem !important;
    font-size: 1rem !important;
  }
  
  .faq-answer {
    padding: 0 1.5rem 1.5rem 1.5rem !important;
  }
  
  .stats-row .v-col {
    margin-bottom: 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}

@media (max-width: 600px) {
  .hero-section {
    min-height: 70vh;
    padding: 2rem 0;
  }
  
  .hero-content {
    padding: 0 1rem;
  }
  
  .section-header {
    margin-bottom: 2rem;
  }
  
  .how-it-works-section,
  .featured-section,
  .testimonials-section,
  .faq-section,
  .cta-section {
    padding: 3rem 0;
  }
  
  .cta-content {
    padding: 2.5rem 1.5rem;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .cta-btn-primary,
  .cta-btn-secondary {
    width: 100%;
    max-width: 300px;
  }
  
  .process-steps {
    gap: 1.5rem;
  }
  
  .join-methods {
    padding: 1.5rem;
  }
  
  .event-grid {
    margin-top: 1.5rem;
  }
  
  .testimonial-content {
    padding: 1.5rem 1rem;
  }
  
  .testimonial-text {
    font-size: 1rem;
  }
  
  .author-name {
    font-size: 1rem;
  }
  
  .faq-question {
    padding: 1rem 1.25rem !important;
    font-size: 0.95rem !important;
  }
  
  .faq-answer {
    padding: 0 1.25rem 1.25rem 1.25rem !important;
    font-size: 0.9rem !important;
  }
  
  .stat-item {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .demo-note {
    font-size: 0.9rem;
    padding: 0 1rem;
  }
}

/* Animation utilities */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Add subtle animations */
.process-step,
.join-method,
.event-card,
.testimonial-card,
.stat-item,
.faq-panel {
  animation: fadeInUp 0.6s ease-out;
}

.step-number {
  animation: pulse 2s infinite;
}

.testimonial-quote {
  animation: fadeIn 1s ease-out 0.3s both;
}

.stat-number {
  animation: countUp 1.5s ease-out;
}

/* Improve loading states */
.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Enhanced hover effects */
.hero-btn-primary,
.hero-btn-secondary,
.demo-btn {
  position: relative;
  overflow: hidden;
}

.hero-btn-primary::after,
.hero-btn-secondary::after,
.demo-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.hero-btn-primary:active::after,
.hero-btn-secondary:active::after,
.demo-btn:active::after {
  width: 300px;
  height: 300px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes countUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>