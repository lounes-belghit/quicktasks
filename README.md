# Todo Backend API

A simple Express.js backend for managing todos with JWT authentication and SQLite storage.

## Features

- User registration
- User login
- JWT-based authentication
- Protected todo routes
- SQLite database persistence
- Simple REST API design

## Tech Stack

- Node.js
- Express.js
- SQLite
- JWT
- bcryptjs

## Project Structure

```text
project2_JS/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── db.js
│   ├── server.js
│   ├── middelware/
│   │   └── authMiddelware.js
│   └── routes/
│       ├── authRoutes.js
│       └── todoRoutes.js
├── .env
├── doc.md
├── Notes.md
├── package.json
├── todo_app.rest
└── README.md
```

## Prerequisites

Make sure you have installed:

- Node.js
- npm

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd project2_JS
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add your JWT secret:

```env
JWT_SECRET=your_super_secret_key
PORT=5000
```

## Run the app

```bash
npm start
```

The server will run on:

```text
http://localhost:5000
```

## API Endpoints

### Authentication

#### Register user

```http
POST /auth/register
Content-Type: application/json
```

Request body:

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "testpassword"
}
```

Response:

```json
{
  "token": "<jwt_token>"
}
```

#### Login user

```http
POST /auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "testuser@example.com",
  "password": "testpassword"
}
```

Response:

```json
{
  "token": "<jwt_token>"
}
```

### Protected Todos

Use JWT authentication for all todo routes.

```http
Authorization:  <jwt_token>
```

#### Get all todos

```http
GET /todos/
```

#### Create todo

```http
POST /todos/
```

#### Update todo

```http
PUT /todos/:id
```

#### Delete todo

```http
DELETE /todos/:id
```

## Authentication Behavior

The middleware verifies the JWT from the Authorization header before allowing access to todo routes.

Expected header format:

```http
Authorization:  <jwt_token>
```

If the token is missing, invalid, or expired, the server may respond with:

- 401 Unauthorized
- 403 Forbidden

## Notes

- The todo create, update, and delete routes are currently scaffolded and not fully implemented yet.
- The main purpose of the project is to demonstrate authentication with protected routes.
- You can also review the project documentation in [doc.md](doc.md).

## License

This project is for educational/demo purposes.
