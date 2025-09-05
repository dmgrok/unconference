// Add these to your nuxt.config.ts runtimeConfig.public section:

export default defineNuxtConfig({
  // ... existing config
  runtimeConfig: {
    public: {
      // ... existing public config
      devMode: process.env.APP_ENV === 'development',
      
      // Test credentials (only for development)
      ...(process.env.APP_ENV === 'development' && {
        testSuperAdminEmail: process.env.TEST_SUPER_ADMIN_EMAIL || '',
        testSuperAdminPassword: process.env.TEST_SUPER_ADMIN_PASSWORD || '',
        testAdminEmail: process.env.TEST_ADMIN_EMAIL || '',
        testAdminPassword: process.env.TEST_ADMIN_PASSWORD || '',
        testOrganizerEmail: process.env.TEST_ORGANIZER_EMAIL || '',
        testOrganizerPassword: process.env.TEST_ORGANIZER_PASSWORD || '',
        testUserEmail: process.env.TEST_USER_EMAIL || '',
        testUserPassword: process.env.TEST_USER_PASSWORD || '',
      })
    }
  }
})
