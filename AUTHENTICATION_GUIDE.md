# Complyze Extension Authentication Guide

## Overview

The Complyze Chrome extension now includes a built-in authentication system that connects users to their Complyze account. This ensures that all prompt events and PII detections are properly logged to the correct user in the Supabase database.

## Key Features

### 🔐 Sidebar Login System
- **Location**: Located at the bottom of the Complyze sidebar panel
- **Access**: Click the gear icon (⚙️) to open the sidebar and scroll to the bottom
- **Purpose**: Authenticates users with their Complyze account credentials

### 📊 Real-Time Synchronization
- **User UUID Sync**: Automatically syncs authenticated user UUID to all logging events
- **No Test Data**: Eliminates test UUIDs and ensures production-ready logging
- **Persistent Login**: Stores authentication data locally for seamless experience

## Authentication Flow

### 1. Opening the Login Form
```
1. Visit any AI platform (ChatGPT, Claude, Gemini)
2. Look for the gear icon (⚙️) on the left side of the screen
3. Click the gear to open the Complyze sidebar
4. Scroll to the bottom to find the login section
```

### 2. Logging In
```
🔐 Complyze Account
Email: [your-email@example.com]
Password: [your-password]
[Login & Sync]
```

### 3. Authentication Success
Once logged in, you'll see:
```
✅ Logged In
your-email@example.com    [Logout]

Active Rules: X    Total Rules: Y
```

## Technical Implementation

### Authentication API
- **Endpoint**: `https://complyze.co/api/auth/login`
- **Method**: POST
- **Required**: Email and password
- **Response**: User UUID and authentication token

### Data Storage
The extension securely stores:
- `complyzeUserEmail`: User's email address
- `complyzeUserUUID`: Unique user identifier for Supabase logging
- `complyzeAuthToken`: Authentication token for API calls

### Event Logging
All prompt events now require authentication:
- **PII Detection Events**: Only logged for authenticated users
- **Prompt Optimization Events**: Only logged for authenticated users
- **Warning**: Unauthenticated users see warning messages in console

## Security Features

### 🔒 Secure Storage
- Uses Chrome's secure local storage API
- Authentication tokens are encrypted by Chrome
- Data persists across browser sessions

### 🛡️ Authentication Validation
- Real-time validation of login credentials
- Secure token-based authentication
- Automatic logout on invalid sessions

### 🚫 No Anonymous Logging
- Prevents test/anonymous data in production database
- Ensures GDPR compliance with proper user consent
- Maintains data integrity and user attribution

## User Experience

### Login States

#### Before Login
```
🔐 Complyze Account
Email: [                    ]
Password: [                 ]
[Login & Sync]
```

#### During Login
```
🔐 Complyze Account
Email: [user@example.com    ]
Password: [                 ]
[🔄 Logging in...]
Authenticating...
```

#### After Login
```
✅ Logged In
user@example.com    [Logout]

Active Rules: 15    Total Rules: 30
```

### Error Handling
- **Invalid Credentials**: "❌ Authentication failed"
- **Network Errors**: "❌ Unable to connect to Complyze servers"
- **Empty Fields**: "Please enter email and password"

## Console Messages

### Authentication Success
```
✅ User authenticated successfully: user@example.com
🆔 User UUID: abc123-def456-ghi789
📤 Sending PII detection event to background (authenticated user)
✅ Successfully synced to Supabase
```

### Authentication Required
```
⚠️ User not authenticated. Prompt events will not be logged. Please login through the Complyze sidebar.
❌ No authenticated user found. Please login through the sidebar.
```

## Troubleshooting

### Common Issues

#### 1. Gear Icon Not Visible
```bash
# Debug commands in browser console:
debugComplyzeExtension()
forceInitializeComplyzeSidebar()
```

#### 2. Login Button Not Responding
- Ensure you're on a supported AI platform
- Check browser console for JavaScript errors
- Try refreshing the page and logging in again

#### 3. Events Not Logging
- Verify you're logged in (check sidebar footer)
- Look for authentication warnings in console
- Ensure you have internet connectivity

#### 4. Persistent Login Issues
```javascript
// Clear stored authentication data
chrome.storage.local.remove(['complyzeUserEmail', 'complyzeUserUUID', 'complyzeAuthToken'])
```

## API Integration

### Backend Requirements
Your Complyze backend must support:
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "success": true,
  "user_id": "uuid-string",
  "token": "auth-token"
}
```

### Supabase Integration
Events are logged to the `prompt_events` table with:
- `user_id`: Authenticated user UUID
- `event_type`: Type of event (pii_detection, prompt_optimization)
- `metadata`: Event-specific data and context
- `created_at`: Timestamp of the event

## Privacy & Compliance

### Data Collection
- **User Credentials**: Only during authentication, not stored permanently
- **User UUID**: Stored locally for session management
- **Prompt Data**: Only logged for authenticated, consenting users

### GDPR Compliance
- Users must explicitly log in to enable data collection
- Clear indication of when data is being logged
- Easy logout functionality to stop data collection

### Data Retention
- Authentication data stored until user logs out
- Prompt events retained according to your Complyze privacy policy
- Users can request data deletion through your standard processes

## Updates & Maintenance

### Version Compatibility
- Compatible with Complyze API v1.0+
- Requires Supabase database with `prompt_events` table
- Chrome extension manifest v3 required

### Future Enhancements
- Two-factor authentication support
- SSO integration options
- Enhanced session management
- Offline authentication caching

## Support

For technical support or authentication issues:
1. Check the browser console for error messages
2. Verify your Complyze account credentials
3. Ensure the extension has latest updates
4. Contact Complyze support with console logs

---

**Note**: This authentication system ensures that all logged events are properly attributed to authenticated users, maintaining data integrity and supporting compliance requirements for enterprise deployments. 