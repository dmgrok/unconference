// Note: This middleware can't use server-only services directly
// We'll check permissions via API calls instead

interface User {
    id?: string
    name: string
    email: string
    role?: string
    globalRole?: string
    isGuest?: boolean
    currentEventId?: string
}

export default defineNuxtRouteMiddleware(async (to) => {
    const { loggedIn, user } = useUserSession()
    
    // redirect the user to the login screen if they're not authenticated
    if (!loggedIn.value) {
        return navigateTo('/login')
    }

    const currentUser = user.value as User
    
    // Check if page requires event context
    const eventId = to.query.eventId as string || currentUser?.currentEventId
    
    if (to.meta.requiresEvent && !eventId) {
        // Redirect to event selection if no event context
        return navigateTo('/events')
    }
    
    // Legacy admin check (for platform-wide admin pages)
    if (to.meta.requiresAdmin) {
        if (currentUser?.globalRole !== 'SuperAdmin' && currentUser?.role !== 'Admin') {
            return navigateTo('/voting')
        }
    }
    
    // Super admin check
    if (to.meta.requiresSuperAdmin && currentUser?.globalRole !== 'SuperAdmin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Super admin access required'
        })
    }
})
