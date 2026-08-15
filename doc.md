# Backend API Documentation

This project is a simple todo backend with user authentication and protected todo routes.

## Base URL

- Local development: http://localhost:5000

## Authentication

The app uses JWT authentication.

For protected routes, send the token in the Authorization header using the Bearer format:

Authorization: Bearer <jwt_token>

If the Authorization header is missing, invalid, or the token is expired, the server returns:

- 401 Unauthorized for missing or malformed token
- 403 Forbidden for invalid/expired token

---

## Auth Routes

### 1) Register a new user

- Method: POST
- URL: /auth/register
- Body:

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "testpassword"
}
```

#### Responses

- 201 Created: user created successfully
- 503 Service Unavailable: database error or insert failed

#### Example response

```json
{
  "token": "<jwt_token>"
}
```

---

### 2) Login user

- Method: POST
- URL: /auth/login
- Body:

```json
{
  "email": "testuser@example.com",
  "password": "testpassword"
}
```

#### Responses

- 200 OK: login successful
- 401 Unauthorized: wrong password
- 404 Not Found: user does not exist
- 503 Service Unavailable: database or server error

#### Example response

```json
{
  "token": "<jwt_token>"
}
```

---

## Todo Routes

These routes are protected by the authentication middleware. The middleware runs before the todo route logic.

### 1) Get all todos for the logged-in user

- Method: GET
- URL: /todos/
- Headers:

```http
Authorization: Bearer <jwt_token>
```

#### Behavior

The middleware verifies the JWT and sets the user id. The route then fetches tasks belonging to that user.

#### Responses

- 200 OK: returns the tasks list
- 401 Unauthorized: no token
- 403 Forbidden: invalid or expired token
- 503 Service Unavailable: database issue

#### Example response

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Default Task",
      "user_id": 1
    }
  ]
}
```

---

### 2) Create a todo

- Method: POST
- URL: /todos/
- Headers:

```http
Authorization: Bearer <jwt_token>
```

#### Current status

This route is defined but not implemented yet.

---

### 3) Update a todo

- Method: PUT
- URL: /todos/:id
- Headers:

```http
Authorization: Bearer <jwt_token>
```

#### Current status

This route is defined but not implemented yet.

---

### 4) Delete a todo

- Method: DELETE
- URL: /todos/:id
- Headers:

```http
Authorization: Bearer <jwt_token>
```

#### Current status

This route is defined but not implemented yet.

---

## Middleware Behavior

The auth middleware reads the Authorization header and extracts the token:

```js
const token = req.headers.authorization?.split(' ')[1]
```

It expects the format:

```http
Authorization: Bearer <token>
```

Then it validates the token using JWT and stores the user id in req.user_id.

---

## Notes

- The app uses SQLite database access for users and tasks.
- The todo routes are protected globally via app.use('/todos', authMiddelware, todoRoutes).
- The user id from the verified JWT is used to restrict each user to their own tasks.
