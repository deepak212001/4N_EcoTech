# Backend (Node.js + Express + MongoDB)

## Features

- User register/login with JWT
- Providers APIs
- Appointment booking APIs
- List my appointments
- Cancel appointment
- Double-booking protection:
  - Application-level check before create
  - DB-level unique partial index for `booked` slots

## .env setup

Create `server/.env` from `.env.example`:

```sh
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/appointment_db
CORS_ORIGIN=*
TOKEN_SECRET=replace_with_a_long_secret
TOKEN_EXPIRY=1d
```

## Install and run

```sh
npm install
npm run seed:providers
npm run dev
```

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/providers`
- `GET /api/providers/:id`
- `POST /api/appointments` (auth required)
- `GET /api/appointments` (auth required)
- `DELETE /api/appointments/:id` (auth required)
