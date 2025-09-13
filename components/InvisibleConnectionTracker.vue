<template>
  <!-- Hidden component for automatic connection tracking -->
  <div style="display: none;"></div>
</template>

<script setup lang="ts">
// Phase 1: Invisible Connection Tracker
const { currentEventId } = useEventContext()
const { user } = useUserSession()
const { createConnection } = useConnections()
const { checkAchievements } = useAchievements()

const props = defineProps<{
  context: 'voting' | 'room-assignment' | 'discussion'
  topicId?: string
  roomId?: string
  participants?: string[]
}>()

const emit = defineEmits<{
  connectionCreated: [connection: any]
  achievementUnlocked: [achievement: any]
}>()

// Track when users interact in the same context
const trackParticipantInteraction = async (otherParticipants: string[]) => {
  if (!user.value || !currentEventId.value || !otherParticipants.length) return
  
  const userId = (user.value as any).id
  if (!userId) return
  
  let connectionsCreated = 0
  
  // Create connections with other participants
  for (const otherUserId of otherParticipants) {
    if (otherUserId === userId) continue
    
    try {
      const connection = await createConnection({
        otherPersonId: otherUserId,
        sharedTopics: props.topicId ? [props.topicId] : [],
        collaboratedOn: props.roomId ? [props.roomId] : [],
        connectionStrength: getConnectionStrength()
      })
      
      if (connection) {
        emit('connectionCreated', connection)
        connectionsCreated++
      }
    } catch (error) {
      // Silently handle errors - this is background tracking
      console.debug('Connection tracking failed:', error)
    }
  }
  
  // Check for achievements after creating connections
  if (connectionsCreated > 0) {
    try {
      const achievementResult = await checkAchievements() as any
      if (achievementResult?.newAchievements?.length > 0) {
        achievementResult.newAchievements.forEach((achievement: any) => {
          emit('achievementUnlocked', achievement)
        })
      }
    } catch (error) {
      console.debug('Achievement check failed:', error)
    }
  }
}

// Determine connection strength based on context
const getConnectionStrength = (): number => {
  switch (props.context) {
    case 'voting':
      return 1 // Light connection - voted for same topic
    case 'room-assignment':
      return 2 // Medium connection - assigned to same room
    case 'discussion':
      return 3 // Strong connection - actively discussing together
    default:
      return 1
  }
}

// Watch for changes in participants and track interactions
watch(() => props.participants, (newParticipants) => {
  if (newParticipants && newParticipants.length > 1) {
    trackParticipantInteraction(newParticipants)
  }
}, { immediate: true })

// Also track when topic/room changes (strengthens existing connections)
watch([() => props.topicId, () => props.roomId], () => {
  if (props.participants && props.participants.length > 1) {
    trackParticipantInteraction(props.participants)
  }
})
</script>
