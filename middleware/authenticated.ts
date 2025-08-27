interface User {
    name: string;
    email: string;
    role?: string;
    isGuest?: boolean;
}

export default defineNuxtRouteMiddleware((to) => {
    const { loggedIn, user } = useUserSession()
    
    // redirect the user to the login screen if they're not authenticated
    if (!loggedIn.value) {
        return navigateTo('/login')
    }

    // check if the page requires admin role
    const userRole = (user.value as any)?.Role || (user.value as any)?.role
    if (to.meta.requiresAdmin && !['Admin', 'Organizer'].includes(userRole)) {
        // if user is not an admin or organizer, redirect to voting page
        return navigateTo('/voting')
    }
})
