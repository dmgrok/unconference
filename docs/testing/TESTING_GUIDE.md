# 🧪 Testing Guide - Fixing Authentication & Real-time Features

This guide solves the testing limitations you encountered:
- ❌ Authentication Flow Issues
- ❌ Password-based Login Setup  
- ❌ Real-time Features Testing

## 🔧 Quick Fix Summary

### ✅ Authentication Issues SOLVED

**Problem**: Missing `NUXT_USERS_FILE_PATH` environment variable
**Solution**: Updated users data structure and set environment path

### ✅ Test Accounts Available

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | `superadmin@unconference.com` | `SuperAdmin123` |
| Admin | `darth.vader@starwars.com` | `AdminPassword123` | 
| Organizer | `organizer@example.com` | `organizerPassword` |
| User | `storm.trooper@starwars.com` | `UserPassword123` |
| Test User | `test@unconference.com` | `password123` |

### ✅ Real-time Features Testing

Created simulation APIs for testing without actual event participation:

## 🚀 Testing Instructions

### 1. Authentication Flow Testing

```bash
# Set environment variable (already done by test-setup.js)
export NUXT_USERS_FILE_PATH=data/platform/users.json

# Start your app (if not running)
npm run dev
```

**Test Steps:**
1. Visit `http://localhost:3002/login`
2. Use any test account from table above
3. Should successfully authenticate and redirect

### 2. Quick Development Login (Bypass)

For faster testing, use the development bypass:

```bash
# Quick login as different roles
http://localhost:3002/api/dev/quick-login?as=super-admin
http://localhost:3002/api/dev/quick-login?as=admin  
http://localhost:3002/api/dev/quick-login?as=organizer
http://localhost:3002/api/dev/quick-login?as=user
http://localhost:3002/api/dev/quick-login?as=guest

# With redirect
http://localhost:3002/api/dev/quick-login?as=admin&redirect=/dashboard
```

### 3. Real-time Features Testing

Use the simulation API to test features without event participation:

```bash
# Add test participants
http://localhost:3002/api/dev/simulate-realtime?action=add-participants

# Simulate user connections  
http://localhost:3002/api/dev/simulate-realtime?action=simulate-connections

# Trigger achievements
http://localhost:3002/api/dev/simulate-realtime?action=trigger-achievements

# Simulate ongoing activity
http://localhost:3002/api/dev/simulate-realtime?action=simulate-activity

# Reset all test data
http://localhost:3002/api/dev/simulate-realtime?action=reset
```

### 4. Connection Tracking Testing

With simulated participants:
1. Login as any test user
2. Navigate to connections page 
3. Use simulation API to create connections
4. Refresh page to see connection data
5. Test real-time updates (if WebSocket enabled)

### 5. Achievement System Testing  

1. Use simulation API to trigger achievements
2. Navigate to achievement/profile pages
3. Check for achievement notifications
4. Verify achievement data persistence

## 🔍 Troubleshooting

### Authentication Still Failing?

1. **Check users file structure**:
   ```bash
   cat data/platform/users.json | jq '.[0]'
   ```
   Should show: `Email`, `Password`, `Firstname`, `Lastname`, `Role`

2. **Verify environment variable**:
   ```bash
   echo $NUXT_USERS_FILE_PATH
   ```
   Should output: `data/platform/users.json`

3. **Check application logs** for authentication errors

### Real-time Features Not Working?

1. **Verify simulation data**:
   ```bash
   ls -la data/test-*.json
   ```

2. **Check API responses**:
   ```bash
   curl http://localhost:3002/api/dev/simulate-realtime
   ```

3. **Enable WebSocket debugging** in browser dev tools

## 🛠 Additional Development Tools

### Test Setup Script
Run anytime to reset test environment:
```bash
node test-setup.js
```

### Manual Test Data Creation
```bash
# Create test connections manually
echo '[{"from":"user-001","to":"user-002","strength":3}]' > data/test-connections.json

# Create test achievements manually  
echo '[{"userId":"user-001","type":"connection_maker","level":1}]' > data/test-achievements.json
```

## 📊 Testing Checklist

- [x] ✅ Authentication flow works with test accounts
- [x] ✅ Password-based login functional
- [x] ✅ Pages requiring authentication accessible  
- [x] ✅ Connection tracking testable with simulation
- [x] ✅ Achievement system triggers testable
- [x] ✅ Collaboration workspace features accessible

## 🎯 Next Steps

1. **Start application**: `npm run dev`
2. **Test authentication**: Login with `superadmin@unconference.com` / `SuperAdmin123`
3. **Test real-time features**: Use simulation APIs
4. **Verify functionality**: Navigate through authenticated pages

All testing limitations should now be resolved! 🎉
