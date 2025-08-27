// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    ssr: true,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#6366F1', // Indigo 500 - Modern, accessible primary
            'primary-darken-1': '#4F46E5', // Indigo 600
            secondary: '#8B5CF6', // Violet 500 - Complementary
            'secondary-darken-1': '#7C3AED', // Violet 600
            accent: '#06B6D4', // Cyan 500 - Fresh accent
            error: '#EF4444', // Red 500 - Clear error state
            warning: '#F59E0B', // Amber 500
            info: '#3B82F6', // Blue 500
            success: '#10B981', // Emerald 500
            surface: '#FFFFFF',
            'surface-variant': '#F8FAFC', // Slate 50
            'on-surface': '#1E293B', // Slate 800
            'on-surface-variant': '#64748B', // Slate 500
            background: '#FEFEFE',
            'on-background': '#1E293B',
          },
        },
        dark: {
          colors: {
            primary: '#818CF8', // Indigo 400 - Lighter for dark mode
            'primary-darken-1': '#6366F1', // Indigo 500
            secondary: '#A78BFA', // Violet 400
            'secondary-darken-1': '#8B5CF6', // Violet 500
            accent: '#22D3EE', // Cyan 400
            error: '#F87171', // Red 400
            warning: '#FBBF24', // Amber 400
            info: '#60A5FA', // Blue 400
            success: '#34D399', // Emerald 400
            surface: '#1E293B', // Slate 800
            'surface-variant': '#334155', // Slate 700
            'on-surface': '#F1F5F9', // Slate 100
            'on-surface-variant': '#CBD5E1', // Slate 300
            background: '#0F172A', // Slate 900
            'on-background': '#F1F5F9',
          },
        },
      },
    },
    defaults: {
      VBtn: {
        style: 'text-transform: none; letter-spacing: normal;',
        class: 'font-weight-medium',
      },
      VCard: {
        elevation: 2,
        class: 'rounded-lg',
      },
      VTextField: {
        variant: 'outlined',
        color: 'primary',
      },
      VSelect: {
        variant: 'outlined',
        color: 'primary',
      },
      VTextarea: {
        variant: 'outlined',
        color: 'primary',
      },
    },
  })
  app.vueApp.use(vuetify)
})
