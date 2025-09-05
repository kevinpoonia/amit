# Investment Platform Admin Panel

## Overview
This is a complete admin panel implementation for the investment platform with all necessary components, database schema, and documentation.

## Files Included

### Database
- `database/investment-platform-schema.sql` - Complete database schema with admin user

### Frontend
- `frontend/src/components/AdminPanelComplete.js` - Complete admin panel component
- `frontend/src/components/AdminPanelComplete.css` - Styling for the admin panel

### Backend
- `backend/admin-routes.js` - All admin API endpoints

### Documentation
- `docs/admin-panel-complete.md` - Complete documentation for the admin panel

### Scripts
- `scripts/create-admin-user-complete.js` - Script to create/update admin user

## Setup Instructions

### 1. Database Setup
Run the SQL script to set up the database schema:
```sql
-- Run database/investment-platform-schema.sql in your Supabase SQL editor
```

### 2. Backend Setup
1. Add the admin routes to your main server.js file:
```javascript
// In server.js, after your existing routes
const adminRoutes = require('./admin-routes');
// Make sure to add the middleware and routes from admin-routes.js to your server
```

2. Ensure you have the required dependencies in your package.json:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.55.0",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### 3. Frontend Setup
1. Import the admin panel component in your App.js:
```javascript
import AdminPanelComplete from './components/AdminPanelComplete';
import './components/AdminPanelComplete.css';
```

2. Add a route to the admin panel in your router:
```javascript
<Route path="/admin" element={<AdminPanelComplete />} />
```

### 4. Create Admin User
Run the script to create the admin user:
```bash
cd scripts
node create-admin-user-complete.js
```

## Admin Login Credentials
- Email: admin@investpro.com
- Password: Admin123!

## Features

### Pending Requests Management
- View all pending recharge requests
- View all pending withdrawal requests
- Approve or reject requests with a single click

### User Management
- Search users by name, email, or mobile number
- View detailed user information
- Adjust user balances with reason tracking

## Security
- Admin-only access to all endpoints
- JWT token authentication
- Balance adjustment logging
- Transaction rollback on errors

## Responsive Design
The admin panel works on all device sizes:
- Desktop
- Tablet
- Mobile

## Customization
You can customize the admin panel by modifying:
- `AdminPanelComplete.js` - Component logic
- `AdminPanelComplete.css` - Styling
- `admin-routes.js` - API endpoints

## Troubleshooting
1. If you can't access the admin panel, verify the user has `is_admin = true` in the database
2. If API calls fail, check that the backend server is running
3. If database operations fail, verify all required tables exist

## Support
For issues with the admin panel, refer to the documentation in `docs/admin-panel-complete.md` or contact the development team.