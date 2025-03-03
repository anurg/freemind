# FreeMind Project Setup Guide

This document provides step-by-step instructions for setting up the FreeMind project from scratch, including installing dependencies, setting up the database, and running the application.

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL database server

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd freemind
```

## Step 2: Install Dependencies

Install all the required dependencies for the project:

```bash
npm install
```

This will install all the dependencies listed in the `package.json` file, including:
- Next.js framework
- React
- Prisma ORM
- UI components from Radix UI
- Authentication libraries (bcryptjs, jsonwebtoken)
- PDF generation libraries (jspdf, jspdf-autotable)
- TypeScript and other development dependencies

## Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with the following content:

```
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/freemind?schema=public"

# JWT Secret for authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Application settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Replace `username`, `password`, and other values with your actual configuration.

## Step 4: Set Up the Database

### 4.1 Create the Database

Create a PostgreSQL database named `freemind`:

```bash
createdb freemind
```

Or use a PostgreSQL client to create the database.

### 4.2 Generate Prisma Client

Generate the Prisma client based on your schema:

```bash
npx prisma generate
```

### 4.3 Run Database Migrations

Apply the database migrations to set up the schema:

```bash
npx prisma migrate deploy
```

This will create all the necessary tables in the database according to the schema defined in `prisma/schema.prisma`.

### 4.4 Seed the Database

Populate the database with initial data:

```bash
npx prisma db seed
```

This will create:
- Default users (admin, manager, user) with predefined passwords
- Default categories
- Sample tasks, comments, and other data

## Step 5: Run the Application

Start the development server:

```bash
npm run dev
```

The application should now be running at http://localhost:3000.

## Default User Credentials

The seed script creates the following users:

1. Admin User
   - Username: admin
   - Email: admin@freemind.com
   - Password: admin123
   - Role: ADMIN

2. Manager User
   - Username: manager
   - Email: manager@freemind.com
   - Password: manager123
   - Role: MANAGER

3. Regular User
   - Username: user
   - Email: user@freemind.com
   - Password: user123
   - Role: USER

## Database Reset and Cleanup

If you need to reset the database:

1. Drop all tables (this will delete all data):
   ```bash
   npx prisma migrate reset
   ```

2. Apply migrations and seed again:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Troubleshooting

### Prisma Issues

If you encounter issues with Prisma:

1. Verify your database connection in the `.env` file
2. Try regenerating the Prisma client:
   ```bash
   npx prisma generate
   ```
3. Reset the database if needed:
   ```bash
   npx prisma migrate reset
   ```

### Next.js Build Issues

If you encounter issues with Next.js build:

1. Clear the `.next` directory:
   ```bash
   rm -rf .next
   ```
2. Reinstall dependencies:
   ```bash
   npm install
   ```
3. Rebuild the application:
   ```bash
   npm run build
   ```

## Additional Commands

- Check database status:
  ```bash
  npx prisma studio
  ```

- Run linting:
  ```bash
  npm run lint
  ```

- Build for production:
  ```bash
  npm run build
  ```

- Start production server:
  ```bash
  npm start
  ```
