# Request Management System API

# FrontEnd WebApp
FrotnEnd (Website) source code can be found **[HERE](https://github.com/NotReal003/Requests)**.
## Overview
This project is a fully functional request management system, designed for users to submit various types of requests such as Discord reports, support requests, and guild applications. Administrators can manage these requests with advanced control options. Additionally, the system incorporates a cryptocurrency payment feature, allowing users to support the project using different crypto wallets.

The system utilizes React for the frontend and Node.js with MongoDB for the backend. Features include JWT-based authentication, email notifications, request status updates, and an admin dashboard for managing user requests.

## Support This Project

I've spent a lot of time on this, to keep me working and for motivation, you can support me by paying with Crypto Currency 💲 

#### BITCOIN
```bash
bc1qrhdcy3vl2qkjjq3ufc0u70vtun4f7yfavcl6x9
```
#### LTC
```bash
LaGrw1RgSWnhxKo1SiG9D9n4tVTVJyL2VC
```

For more info, please visit **https://pay.notreal003.xyz** :)

## Installation

### Prerequisites
- Node.js and npm installed.
- MongoDB Atlas or local MongoDB setup.

### Backend Setup
1. Clone the repository:  
`git clone https://github.com/NotReal003/API.git`
2. Install dependencies:  
```bash
npm install
```
3. Configure environment variables:
```bash
MONGODB_URI=mongodb+srv://username@cluster.mongodb.net/database
JWT_SECRET=your_jwt_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
NODE_ENV=production
DISCORD_REDIRECT_URI=callback_url
DISCORD_WEBHOOK_URL=first_request_route_webhookurl
DISCORD_WEBHOOK_URL1=second_request_route_webhookurl
EMAIL=email
EPASS=email_password
NODE_ENV=production
SESSION_SECRET=...
WEB_TOKEN=an_webhook_url(please test it)
USER_AUTH_WEBTOKEN=user_auth_logger_webhookurl
ADMIN_ID=theAdminId(user_id)
G_ID=github_client_id
G_SECRET=github_client_secret
```
(please note that the GitHub Auth is not available for now so just for optional)
5. Start the backend server:  
```bash
node index.js
```

## Features

### Frontend
- **Request Form Pages**: Users can submit various types of requests, including Discord reports, support requests, and guild applications.
- **Authentication**: JWT-based login/logout with dynamic status display in the navbar.
- **Admin Panel**: Admins can view, approve, reject, or cancel requests and leave review messages.
- **User Dashboard**: Users can view their request history and status updates.
- **Crypto Support**: Integrated cryptocurrency payment system for user support.
- **Responsive Design**: Optimized for various devices using modern design practices.

### Backend
- **Request Routes**: Handles Support, Discord Report, and Guild Application requests.
- **JWT Authentication**: Secure token-based access control.
- **Request Status**: Tracks requests with status updates (Approved, Denied, Cancelled, Pending) and review messages.
- **Admin Routes**: Admin-specific routes for managing requests and users.
- **Email Notifications**: Automatic notifications for request status updates.
- **IP Tracking**: Captures user IP addresses for security.

## Tech Stack

### Frontend
- **React**: For building the user interface.
- **React Router**: For navigation.
- **DaisyUI/TailwindCSS**: For UI components and styling.
- **Axios**: For API requests.
- **React-Icons**: For scalable icons.
- **React Hot-Toast**: For notifications.

### Backend
- **Node.js**: Server-side runtime.
- **Express.js**: Web framework.
- **MongoDB**: NoSQL database.
- **JWT**: For authentication.
- **Nodemailer**: For sending emails.
- 
### Features that this project provides.

#### User Authentication
- **Login/Logout**: JWT-based authentication via Discord OAuth.
- **Protected Routes**: Restricted access to certain pages based on authentication.
- **Token Verification**: Validates JWT for secure access.

#### Request Submission Forms
- **Forms**: For Discord reports, support requests, and guild applications.
- **Validation & Sanitization**: Ensures correct input and prevents malicious data.

#### Admin Features
- **Request Management**: View, approve, reject, or cancel requests. Leave review messages.
- **User Management**: Block/unblock users.
- **Status Updates**: Admins can update request statuses and send notifications.

#### Email Notifications
- **Auto-notifications**: Sends emails on request status updates.
- **Custom Messages**: Admins can include custom messages in notifications.

#### Request History
- **User Dashboard**: View request history and status updates.
- **Admin Dashboard**: Manage requests and user actions.

#### Cryptocurrency Payment System
- **Crypto Wallet Integration**: Users can support the project through various cryptocurrencies (e.g., Bitcoin, Ethereum, Litecoin).
- **QR Code Generation**: Users can scan QR codes to make payments easily.
- **Transaction Notifications**: Users can receive confirmation messages after successful transactions.

**[Click here to support this project](https://github.com/NotReal003/API/blob/main/README.md#support-this-project)**.

### Backend API EndPoints (Some are OutDated by now)

#### User Authentication
- **GET `/auth/login`**: Login and return JWT token.
- **GET `/users/@me`**: Get current user details.
- **GET `/auth/signout`**: Logout user.

#### Requests
- **POST `/requests/report`**: Submit a Discord report request.
- **POST `/requests/support`**: Submit a support request.
- **POST `/requests/guild-application`**: Submit a guild application request.
- **GET `/requests`**: Get all requests for the current user.
- **PUT `/requests/:requestId`**: Update request status (Admin only).

#### Admin Routes
- **GET `/admin/requests`**: Get all submitted requests.
- **PUT `/admin/requests/:id`**: Update request status.
- **DELETE `/admin/requests/:id`**: Delete a request.
- **PUT `/admin/users/block`**: Block a user.
- **PUT `/admin/users/unblock`**: Unblock a user.

### Usage

#### User Actions
1. **Login**: Authenticate via Discord OAuth.
2. **Submit Request**: Fill out and submit request forms.
3. **View Requests**: Check request history and status updates.
4. **Email Notifications**: Receive email updates on request status.
5. **Support via Crypto**: Use the cryptocurrency payment system to support the project.

#### Admin Actions
1. **Manage Requests**: Approve, reject, or cancel requests. Leave review messages.
2. **Review Messages**: Admins can add messages visible to users.
3. **User Management**: Block/unblock users as needed.
4. **Request Status**: Update request statuses directly from the dashboard.

### Security
- **JWT Authentication**: Secures routes and user access.
- **Sanitization**: Prevents malicious input.
- **IP Logging**: Tracks user IP addresses for security.

### Conclusion
This request management system offers a comprehensive solution for handling user-submitted requests with robust administrative control and security features. It also incorporates a cryptocurrency payment feature, allowing users to support the project easily. Ideal for businesses or projects needing detailed request tracking and management.

For further details, customization, or support, please [Contact me on Discord](https://discord.gg/sqVBrMVQmp).
