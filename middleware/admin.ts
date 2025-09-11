export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  
  // Check if user is authenticated
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  // Check if user has admin privileges
  const userRole = (user.value as any)?.Role || (user.value as any)?.role || (user.value as any)?.globalRole
  if (!['Admin', 'Organizer', 'SuperAdmin'].includes(userRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
})
