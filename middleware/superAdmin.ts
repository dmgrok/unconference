export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  
  // Check if user is authenticated
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  // Check if user is super admin
  if ((user.value as any)?.globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super Admin access required'
    })
  }
})
