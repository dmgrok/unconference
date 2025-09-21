export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  
  // Check if user is super admin
  const isAdmin = computed(() => (user.value as any)?.globalRole === 'Admin')
  
  // If super admin is trying to access personal events page, redirect to admin events
  if (isAdmin.value && to.path === '/events') {
    return navigateTo('/admin/events')
  }
})
