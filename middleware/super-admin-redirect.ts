export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  
  // Check if user is super admin
  const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
  
  // If super admin is trying to access personal events page, redirect to admin events
  if (isSuperAdmin.value && to.path === '/events') {
    return navigateTo('/super-admin/events')
  }
})
