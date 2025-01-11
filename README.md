# Request Management Portal

## Frontend Web Application
The source code for the frontend web application can be found [here](https://github.com/NotReal003/Requests).

### Overview
This project is a comprehensive request management system that allows users to submit various types of requests, including reports, support requests, and applications. Administrators have the ability to manage these requests through an administrative dashboard.

The system utilizes React for the frontend and Node.js with MongoDB for the backend. Key features include JWT-based authentication, email notifications, request status updates, and an admin dashboard for managing requests.

### Features

#### Frontend
- **Request Form Pages**: Users can submit various types of requests, including reports, support requests, and applications.
- **Authentication**: JWT-based login/logout with dynamic status display in the navbar.
- **Admin Panel**: Administrators can view, approve, reject, or cancel requests and leave review messages.
- **User Dashboard**: Users can view their request history and status updates.
- **Responsive Design**: Optimized for various devices using modern design practices.

#### Backend
- **Request Routes**: Handles support, report, and application requests.
- **JWT Authentication**: Secure token-based access control.
- **Request Status**: Tracks requests with status updates (Approved, Denied, Cancelled, Pending) and review messages.
- **Admin Routes**: Admin-specific routes for managing requests and users.
- **Email Notifications**: Automatic notifications for request status updates.
- **IP Tracking**: Captures user IP addresses for security.

## Technology Stack

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
- **Cloudflare Workers**: For hosting the backend API (optional).

## Detailed Features

### User Authentication
- **Login/Logout**: JWT-based authentication via Discord OAuth or email authentication.
- **Protected Routes**: Restricted access to certain pages based on authentication.
- **Token Verification**: Validates JWT for secure access.

### Request Submission Forms
- **Forms**: For Reports, support requests, and applications.
- **Validation & Sanitization**: Ensures correct input and prevents malicious data.

### Administrative Features
- **Request Management**: View, approve, reject, cancel, or delete requests. Leave review messages.
- **User Management**: Block/unblock users (IP address blocking is under development).
- **Status Updates**: Administrators can update request statuses and send notifications to the user's email.

### Email Notifications
- **Auto-notifications**: Sends emails on request status updates.
- **Custom Messages**: Administrators can include custom review messages in notifications.

### Request History
- **User Dashboard**: View request history and status updates.
- **Admin Dashboard**: Manage requests and user actions.

## Installation Instructions

### Prerequisites
- Node.js and npm installed.
- MongoDB Atlas or local MongoDB setup.
- (Optional) Cloudflare Workers account for backend hosting.

### Frontend Setup
1. Clone the repository:  
   `git clone https://github.com/NotReal003/Requests.git`
2. Install dependencies:  
   `npm install`
3. Create a `.env` file and add your API URL:  
   ```
   REACT_APP_API=your_api_url
   CI=false
   ```
4. Start the React app:  
   `npm start` for development or `npm run build` for production (output will be in `/build`).

### Backend Setup
1. Clone the repository:  
   `git clone https://github.com/NotReal003/API.git`
2. Install dependencies:  
   `npm install`
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
   WEB_TOKEN=an_webhook_url
   USER_AUTH_WEBTOKEN=user_auth_logger_webhookurl
   ADMIN_ID=theAdminId
   G_ID=github_client_id (optional)
   G_SECRET=github_client_secret (optional)
   ```
4. Start the backend server:  
   `node index.js`

## Usage Instructions

### User Actions
1. **Login**: Authenticate via Discord OAuth or SignUp / SignIn using Email.
2. **Submit Request**: Fill out and submit request forms.
3. **View Requests**: Check request history and status updates.
4. **Email Notifications**: Receive email updates on request status.

### Administrative Actions
1. **Manage Requests**: Approve, reject, or cancel requests. Leave review messages.
2. **Review Messages**: Administrators can add messages visible to users.
3. **User Management**: Block/unblock users as needed.
4. **Request Status**: Update request statuses directly from the dashboard.

### Security
- **JWT Authentication**: Secures routes and user access.
- **Sanitization**: Prevents malicious input.
- **IP Logging**: Tracks user IP addresses for security.

## Backend API Endpoints

### User Authentication
- **GET `/auth/login`**: Login and return JWT token.
- **GET `/users/@me`**: Get current user details.
- **GET `/auth/signout`**: Logout user.
- and more...

### Requests
- **POST `/requests/report`**: Submit a Discord report request.
- **POST `/requests/support`**: Submit a support request.
- **POST `/requests/guild-application`**: Submit a guild application request.
- **GET `/requests`**: Get all requests for the current user.
- **PUT `/requests/:requestId`**: Update request status (Admin only).
- and more...

### Administrative Routes
- **GET `/admin/requests`**: Get all submitted requests.
- **PUT `/admin/requests/:id`**: Update request status.
- **DELETE `/admin/requests/:id`**: Delete a request.
- **PUT `/admin/users/block`**: Block a user.
- **PUT `/admin/users/unblock`**: Unblock a user.
- and more...

## License
This project is licensed under the [MIT License](LICENSE).

For further details, customization, or support, please contact me on [Discord](https://discord.gg/sqVBrMVQmp).

---
