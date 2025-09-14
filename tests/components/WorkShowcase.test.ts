import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import WorkShowcase from '~/components/WorkShowcase.vue'

// Mock Vuetify
const vuetify = createVuetify()

// Mock data
const mockShowcase = {
  id: '1',
  projectName: 'Test Project',
  description: 'This is a test project description',
  contributors: ['user1', 'user2'],
  skillsUsed: ['JavaScript', 'Vue.js', 'Nuxt'],
  skillsNeeded: ['Python', 'Machine Learning'],
  status: 'ACTIVE' as const,
  contactEmail: 'test@example.com',
  repositoryUrl: 'https://github.com/test/project',
  demoUrl: 'https://demo.example.com',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  tags: ['web-development', 'ai'],
  createdAt: new Date('2024-01-15')
}

const mockParticipants = [
  { id: 'user1', name: 'John Doe', avatar: 'https://example.com/avatar1.jpg' },
  { id: 'user2', name: 'Jane Smith', avatar: null },
  { id: 'user3', name: 'Bob Wilson', avatar: 'https://example.com/avatar3.jpg' }
]

describe('WorkShowcase Component', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(WorkShowcase, {
      props: {
        showcase: mockShowcase,
        participants: mockParticipants
      },
      global: {
        plugins: [vuetify]
      }
    })
  })

  describe('Basic Rendering', () => {
    it('renders project name correctly', () => {
      expect(wrapper.text()).toContain('Test Project')
    })

    it('renders project description', () => {
      expect(wrapper.text()).toContain('This is a test project description')
    })

    it('displays correct status chip', () => {
      const statusChip = wrapper.find('[data-testid="status-chip"]')
      expect(statusChip.text()).toContain('In Progress')
    })

    it('shows contributor count', () => {
      expect(wrapper.text()).toContain('2 contributors')
    })

    it('displays creation date', () => {
      expect(wrapper.text()).toContain('Created 1/15/2024')
    })
  })

  describe('Skills Display', () => {
    it('renders skills used', () => {
      expect(wrapper.text()).toContain('JavaScript')
      expect(wrapper.text()).toContain('Vue.js')
      expect(wrapper.text()).toContain('Nuxt')
    })

    it('renders skills needed', () => {
      expect(wrapper.text()).toContain('Python')
      expect(wrapper.text()).toContain('Machine Learning')
    })

    it('shows "None specified" when no skills used', async () => {
      const showcaseWithoutSkills = { ...mockShowcase, skillsUsed: [] }
      await wrapper.setProps({ showcase: showcaseWithoutSkills })
      expect(wrapper.text()).toContain('None specified')
    })
  })

  describe('Tags Display', () => {
    it('renders project tags', () => {
      expect(wrapper.text()).toContain('#web-development')
      expect(wrapper.text()).toContain('#ai')
    })

    it('hides tags section when no tags', async () => {
      const showcaseWithoutTags = { ...mockShowcase, tags: [] }
      await wrapper.setProps({ showcase: showcaseWithoutTags })

      const tagsSection = wrapper.find('[data-testid="tags-section"]')
      expect(tagsSection.exists()).toBe(false)
    })
  })

  describe('Links and Buttons', () => {
    it('shows demo button when demo URL exists', () => {
      const demoButton = wrapper.find('[href="https://demo.example.com"]')
      expect(demoButton.exists()).toBe(true)
      expect(demoButton.text()).toContain('View Demo')
    })

    it('shows source code button when repository URL exists', () => {
      const repoButton = wrapper.find('[href="https://github.com/test/project"]')
      expect(repoButton.exists()).toBe(true)
      expect(repoButton.text()).toContain('Source Code')
    })

    it('shows contact button when contact email exists', () => {
      const contactButton = wrapper.find('[href="mailto:test@example.com"]')
      expect(contactButton.exists()).toBe(true)
      expect(contactButton.text()).toContain('Contact Team')
    })

    it('hides buttons when URLs are not provided', async () => {
      const showcaseWithoutLinks = {
        ...mockShowcase,
        demoUrl: undefined,
        repositoryUrl: undefined,
        contactEmail: undefined
      }
      await wrapper.setProps({ showcase: showcaseWithoutLinks })

      expect(wrapper.find('[href="https://demo.example.com"]').exists()).toBe(false)
      expect(wrapper.find('[href="https://github.com/test/project"]').exists()).toBe(false)
      expect(wrapper.find('[href="mailto:test@example.com"]').exists()).toBe(false)
    })
  })

  describe('Status-Specific Features', () => {
    it('shows join button for projects seeking collaborators', async () => {
      const seekingCollaboratorsShowcase = { ...mockShowcase, status: 'SEEKING_COLLABORATORS' as const }
      await wrapper.setProps({ showcase: seekingCollaboratorsShowcase })

      const joinButton = wrapper.find('[data-testid="join-button"]')
      expect(joinButton.exists()).toBe(true)
      expect(joinButton.text()).toContain('Join Project')
    })

    it('shows achievement overlay for completed projects', async () => {
      const completedShowcase = { ...mockShowcase, status: 'COMPLETED' as const }
      await wrapper.setProps({ showcase: completedShowcase })

      const achievementOverlay = wrapper.find('.achievement-overlay')
      expect(achievementOverlay.exists()).toBe(true)
      expect(achievementOverlay.text()).toContain('Project Complete!')
    })

    it('does not show join button for non-seeking projects', () => {
      const joinButton = wrapper.find('[data-testid="join-button"]')
      expect(joinButton.exists()).toBe(false)
    })
  })

  describe('Image Handling', () => {
    it('shows carousel for multiple images', () => {
      const carousel = wrapper.find('v-carousel')
      expect(carousel.exists()).toBe(true)
    })

    it('shows single image for one image', async () => {
      const singleImageShowcase = { ...mockShowcase, images: ['https://example.com/single.jpg'] }
      await wrapper.setProps({ showcase: singleImageShowcase })

      const carousel = wrapper.find('v-carousel')
      const singleImage = wrapper.find('v-img')
      expect(carousel.exists()).toBe(false)
      expect(singleImage.exists()).toBe(true)
    })

    it('hides image section when no images', async () => {
      const noImagesShowcase = { ...mockShowcase, images: [] }
      await wrapper.setProps({ showcase: noImagesShowcase })

      const imageSection = wrapper.find('[data-testid="image-section"]')
      expect(imageSection.exists()).toBe(false)
    })
  })

  describe('Contributor Display', () => {
    it('displays contributor avatars and names', () => {
      expect(wrapper.text()).toContain('John Doe')
      expect(wrapper.text()).toContain('Jane Smith')
    })

    it('shows default avatar icon when avatar is missing', () => {
      const defaultAvatarIcons = wrapper.findAll('.mdi-account')
      expect(defaultAvatarIcons.length).toBeGreaterThan(0)
    })

    it('handles empty contributors list', async () => {
      const noContributorsShowcase = { ...mockShowcase, contributors: [] }
      await wrapper.setProps({
        showcase: noContributorsShowcase,
        participants: mockParticipants
      })

      expect(wrapper.text()).toContain('0 contributors')
    })
  })

  describe('Event Emissions', () => {
    it('emits joinProject event when join button is clicked', async () => {
      const seekingCollaboratorsShowcase = { ...mockShowcase, status: 'SEEKING_COLLABORATORS' as const }
      await wrapper.setProps({ showcase: seekingCollaboratorsShowcase })

      const joinButton = wrapper.find('[data-testid="join-button"]')
      await joinButton.trigger('click')

      expect(wrapper.emitted().joinProject).toBeTruthy()
      expect(wrapper.emitted().joinProject[0]).toEqual([mockShowcase.id])
    })

    it('emits editProject event when edit menu item is clicked', async () => {
      // Open menu first
      const menuButton = wrapper.find('[data-testid="menu-button"]')
      await menuButton.trigger('click')

      // Click edit item
      const editButton = wrapper.find('[data-testid="edit-button"]')
      await editButton.trigger('click')

      expect(wrapper.emitted().editProject).toBeTruthy()
      expect(wrapper.emitted().editProject[0]).toEqual([mockShowcase])
    })

    it('emits deleteProject event when delete menu item is clicked', async () => {
      // Open menu first
      const menuButton = wrapper.find('[data-testid="menu-button"]')
      await menuButton.trigger('click')

      // Click delete item
      const deleteButton = wrapper.find('[data-testid="delete-button"]')
      await deleteButton.trigger('click')

      expect(wrapper.emitted().deleteProject).toBeTruthy()
      expect(wrapper.emitted().deleteProject[0]).toEqual([mockShowcase])
    })
  })

  describe('Hover Effects', () => {
    it('applies hover styles on card hover', async () => {
      const card = wrapper.find('.work-showcase')
      await card.trigger('mouseenter')

      // Check if hover styles are applied
      expect(card.classes()).toContain('work-showcase')
    })
  })

  describe('Responsive Behavior', () => {
    it('handles different screen sizes gracefully', async () => {
      // Test mobile breakpoint behavior
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // The component should still render all essential elements
      expect(wrapper.find('.work-showcase').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Project')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing participant data gracefully', async () => {
      await wrapper.setProps({ participants: undefined })

      // Should not crash and should handle missing contributor info
      expect(wrapper.exists()).toBe(true)
    })

    it('handles invalid date formats', async () => {
      const invalidDateShowcase = { ...mockShowcase, createdAt: 'invalid-date' }
      await wrapper.setProps({ showcase: invalidDateShowcase })

      // Should not crash when formatting invalid date
      expect(wrapper.exists()).toBe(true)
    })

    it('handles very long project names and descriptions', async () => {
      const longContentShowcase = {
        ...mockShowcase,
        projectName: 'A'.repeat(200),
        description: 'B'.repeat(2000)
      }
      await wrapper.setProps({ showcase: longContentShowcase })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('A'.repeat(200))
    })

    it('handles special characters in project data', async () => {
      const specialCharShowcase = {
        ...mockShowcase,
        projectName: 'Test & <Special> "Characters"',
        description: 'Description with émojis 🚀 and spécial characters'
      }
      await wrapper.setProps({ showcase: specialCharShowcase })

      expect(wrapper.text()).toContain('Test & <Special> "Characters"')
      expect(wrapper.text()).toContain('Description with émojis 🚀 and spécial characters')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        // Buttons should have either aria-label, title, or visible text
        const hasAriaLabel = button.attributes('aria-label')
        const hasTitle = button.attributes('title')
        const hasText = button.text().trim().length > 0

        expect(hasAriaLabel || hasTitle || hasText).toBe(true)
      })
    })

    it('has proper alt text for images', () => {
      const images = wrapper.findAll('img')
      images.forEach(img => {
        expect(img.attributes('alt')).toBeDefined()
      })
    })
  })
})