# Role Permissions Update

## Summary
Updated admin API endpoints to allow both Admin and Organizer roles, plus Super Admin global role, improving the user experience for organizers managing events.

## Changes Made

### API Endpoints Updated
The following admin API endpoints now accept both `Admin` and `Organizer` roles:

1. **`/api/admin/topic-selection.get.ts`** - Topic selection for round creation
2. **`/api/admin/start-round.post.ts`** - Starting new discussion rounds
3. **`/api/admin/end-round.post.ts`** - Ending active rounds
4. **`/api/admin/extend-round.post.ts`** - Extending round duration
5. **`/api/admin/round-history.get.ts`** - Viewing round history
6. **`/api/admin/voting-stats.get.ts`** - Accessing voting statistics
7. **`/api/admin/rebalance-groups.post.ts`** - Rebalancing discussion groups
8. **`/api/admin/create-groups.post.ts`** - Creating discussion groups
9. **`/api/admin/rooms.post.ts`** - Managing rooms
10. **`/api/admin/generate-qr.post.ts`** - Generating QR codes

### Before
```typescript
// Only Admin role allowed
if ((user as User).role !== 'Admin') {
  throw createError({
    statusCode: 403,
    message: 'Only administrators can access this feature'
  })
}
```

### After
```typescript
// Admin, Organizer, or Super Admin allowed
const userRole = (user as any).Role || (user as any).role
if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
  throw createError({
    statusCode: 403,
    message: 'Only administrators and organizers can access this feature'
  })
}
```

## User Experience Improvements

### Fixed Issues
- **403 Error on Quick Round Start**: Organizers can now start quick rounds without permission errors
- **Better Role Flexibility**: Organizers have appropriate permissions for event management
- **Consistent Permission Model**: All admin endpoints now follow the same role-checking pattern

### Test Credentials
- **Admin**: `darth.vader@starwars.com` / `AdminPassword123`
- **Organizer**: `organizer@example.com` / `organizerPassword`
- **Super Admin**: `superadmin@unconference.com` / `SuperAdmin123`

## UI Improvements Made

### Voting Status Card
- **Improved Contrast**: Changed from dark background to surface with better text contrast
- **Reduced Vertical Space**: Decreased padding from `py-6` to `py-3`
- **Better Visual Hierarchy**: Used appropriate colors and sizing
- **Enhanced Accessibility**: Better contrast ratios in both light and dark modes

### Changes Applied
- Card elevation reduced from 8 to 2
- Icon and text colors optimized for readability
- Chip sizes and spacing reduced for compactness
- Added visual state indicators for voted status

## Impact
- Organizers can now fully manage their events without admin elevation
- Improved user experience with more readable and compact UI components
- Consistent role-based access control across the platform
- Better accessibility compliance
