# GoviZen Backend

GoviZen - Smart Agriculture Management System Backend

A Node.js/Express backend API for managing agricultural operations, crop tracking, and farm management.

## Features

- RESTful API endpoints
- MongoDB database integration
- User authentication with JWT
- SMS notifications
- File upload handling
- Report generation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

## API Endpoints

- `/api/auth` - Authentication
- `/crops` - Crop management
- `/api/sales` - Sales tracking
- `/api/expenses` - Expense tracking
- `/api/report` - Report generation

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Twilio (SMS)
- Multer (File uploads)