# InvoicePro - Professional Invoice Generator

A full-stack application for creating, managing, and exporting professional invoices for IT consulting businesses.

## Features

- **User Authentication**: Secure login and registration system
- **Invoice Creation**: Create professional invoices with customizable company information
- **Address Book**: Save and manage client information for quick access
- **PDF Export**: Generate and download professional PDF invoices
- **Dashboard**: View and manage all your saved invoices
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React
- React Router
- Axios for API requests
- jsPDF for PDF generation
- Bootstrap 5 for UI components

### Backend
- Node.js with Express
- Prisma ORM
- PostgreSQL (Neon Database)
- JWT for authentication
- bcrypt for password hashing

## Deployment

This application is configured for deployment on Vercel with a Neon PostgreSQL database.

### Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [Neon PostgreSQL Database](https://neon.tech)
3. Node.js and npm installed locally

### Local Development

1. Clone the repository:
   ```
   git clone <repository-url>
   cd invoice-app
   ```

2. Install dependencies:
   ```
   npm run install:all
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection string and JWT secret

4. Run Prisma migrations:
   ```
   cd server
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   cd ..
   npm start
   ```

### Deploying to Vercel

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings:
     - Build Command: `npm run vercel-build`
     - Output Directory: `client/build`

3. Add environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing

4. Deploy!

## Database Schema

The application uses the following database schema:

### User
- `id`: Integer (Primary Key)
- `username`: String (Unique)
- `password`: String (Hashed)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Invoice
- `id`: Integer (Primary Key)
- `userId`: Integer (Foreign Key)
- `client`: String
- `companyInfo`: JSON
- `items`: JSON
- `total`: Float
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Contact
- `id`: Integer (Primary Key)
- `userId`: Integer (Foreign Key)
- `name`: String
- `email`: String (Optional)
- `address`: String (Optional)
- `phone`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## License

MIT
