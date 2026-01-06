# Admin Dashboard Setup Guide

## Overview
The SmartShop application now includes a comprehensive Admin Dashboard with the following features:
- Separate admin authentication
- Product management (CRUD operations)
- Order management with status updates
- Order analytics and statistics
- User management
- Distinct UI design from user interface

## Features

### 1. Admin Authentication
- Separate "Admin Login" option on the login page
- Role-based access control using `isAdmin` flag
- Protected admin routes

### 2. Dashboard Overview
- Total users count
- Total orders count
- Total products count
- Total revenue calculation
- Order status breakdown (Pending, Processing, Shipped, Delivered, Cancelled)

### 3. Product Management
- View all products in a table
- Add new products with form validation
- Edit existing products
- Delete products
- Fields: Name, Description, Price, Stock, Category, Image URL

### 4. Order Management
- View all orders with customer details
- Update order status via dropdown
- Order information: Order ID, Customer, Total, Status, Date
- Status options: Pending, Processing, Shipped, Delivered, Cancelled

### 5. User Management
- View all registered users
- Display user details: Name, Email, Student status, Admin status, Join date

## Setup Instructions

### Step 1: Create Admin User

Run the following command to create an admin user in the database:

```bash
npm run create-admin
```

Default admin credentials:
- **Email**: admin@example.com
- **Password**: Admin123!

**Important**: Change the password after first login for security.

### Step 2: Start the Application

1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd frontend
npm run serve
```

Or run both simultaneously:
```bash
npm run dev:full
```

### Step 3: Access Admin Dashboard

1. Navigate to `http://localhost:8080/auth`
2. Click on the "Admin Login" button at the top
3. Enter admin credentials:
   - Email: admin@example.com
   - Password: Admin123!
4. You will be redirected to `/admin` dashboard

## API Endpoints

### Admin Authentication
- Protected with JWT authentication
- All routes require `isAdmin: true` in user object

### Admin Endpoints

#### Statistics & Analytics
```
GET /api/admin/stats
GET /api/admin/analytics
```

#### Product Management
```
GET    /api/admin/products          - List all products
POST   /api/admin/products          - Create new product
PUT    /api/admin/products/:id      - Update product
DELETE /api/admin/products/:id      - Delete product
```

#### Order Management
```
GET /api/admin/orders               - List all orders
PUT /api/admin/orders/:id/status    - Update order status
```

#### User Management
```
GET /api/admin/users                - List all users
```

## File Structure

### Backend Files
```
backend/
├── middleware/
│   └── auth.js                     - Authentication & authorization middleware
├── routes/
│   └── admin.js                    - Admin API routes
├── scripts/
│   └── createAdmin.js              - Admin user creation script
└── server.js                       - Updated with admin routes
```

### Frontend Files
```
frontend/src/
├── views/
│   ├── AdminDashboard.vue          - Main admin dashboard component
│   └── Auth.vue                    - Updated with admin login option
├── store/modules/
│   └── admin.js                    - Vuex store for admin operations
└── router/
    └── index.js                    - Updated with admin route & guards
```

## Security Features

1. **JWT Authentication**: All admin routes protected with JWT tokens
2. **Role-Based Access**: `isAdmin` flag verification on every request
3. **Route Guards**: Frontend router prevents non-admin access
4. **Middleware Chain**: `authenticate` → `isAdmin` middleware sequence
5. **Secure Password**: Bcrypt hashing with salt rounds

## UI Design

### Admin Dashboard Theme
- **Sidebar**: Dark theme (#2c3e50) with active state indicators
- **Primary Color**: Blue gradient (#3498db)
- **Secondary Color**: Gray (#95a5a6)
- **Success**: Green (#27ae60)
- **Warning**: Orange (#f39c12)
- **Danger**: Red (#e74c3c)
- **Background**: Light gray (#f5f7fa)

### User Interface vs Admin Interface
- Admin has sidebar navigation
- Admin uses darker, professional color scheme
- Admin displays data in tables and cards
- Admin has no shopping cart or product catalog
- Completely separate routing and layout

## Troubleshooting

### Admin Login Fails
- Ensure admin user exists in database (run `npm run create-admin`)
- Check that `isAdmin: true` is set in user document
- Verify JWT token is valid and not expired

### Cannot Access Admin Routes
- Check authentication token in localStorage
- Verify user has `isAdmin: true` flag
- Check browser console for router guard errors

### API Errors
- Ensure backend server is running on port 3000
- Verify MongoDB is connected
- Check that admin routes are registered in server.js

### Product/Order CRUD Not Working
- Verify Product and Order models exist
- Check API endpoint paths match frontend calls
- Review backend logs for validation errors

## Development Notes

### Adding New Admin Features
1. Add backend route in `backend/routes/admin.js`
2. Add Vuex action in `frontend/src/store/modules/admin.js`
3. Update AdminDashboard.vue component with UI
4. Test with admin credentials

### Modifying Admin Permissions
- Update `isAdmin` middleware in `backend/middleware/auth.js`
- Add custom role checks as needed
- Consider adding role hierarchy (super-admin, admin, moderator)

## Production Considerations

1. **Change Default Admin Password**: Never use default credentials in production
2. **Environment Variables**: Store secrets in .env file
3. **HTTPS**: Use SSL/TLS for all admin traffic
4. **Rate Limiting**: Add rate limiting to admin endpoints
5. **Audit Logging**: Log all admin actions for security
6. **Session Management**: Consider session timeouts for admins
7. **Two-Factor Authentication**: Add 2FA for admin accounts

## Future Enhancements

- [ ] Admin activity logs
- [ ] Bulk product import/export
- [ ] Advanced filtering and search
- [ ] Sales reports and charts
- [ ] Email notifications for order status changes
- [ ] Product inventory alerts
- [ ] User management (ban/unban users)
- [ ] Custom discount rules management
- [ ] Site settings configuration
- [ ] Backup and restore functionality

## Support

For issues or questions, please refer to:
- Backend logs in `backend/logs/`
- Browser console for frontend errors
- MongoDB logs for database issues
- Project documentation in `PROJECT_REPORT.md`

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**License**: MIT
