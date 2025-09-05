export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    
    const userId = (user as any).id || (user as any).email
    
    return {
      success: true,
      sessionUser: user,
      extractedUserId: userId,
      userProperties: Object.keys(user || {}),
      debug: {
        hasId: !!(user as any).id,
        hasEmail: !!(user as any).email,
        rawUser: user
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSession: false
    }
  }
})
