# InvoicePro - Professional Invoice Generator

A full-stack application for creating, managing, and exporting professional invoices for IT consulting businesses.

## Features

- **User Authentication**: Secure login and registration system
- **Invoice Creation**: Create professional invoices with customizable company information
- **Address Book**: Save and manage client information for quick access
- **PDF Export**: Generate and download professional PDF invoices
- **Dashboard**: View and manage all your saved invoices
- **Integrations**: Connect with popular CRM, storage, and communication services
- **Templates**: Create and manage invoice templates
- **Catalog**: Manage product and service catalog
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React
- React Router
- Material-UI (MUI) for components
- Axios for API requests
- jsPDF for PDF generation
- Bootstrap 5 for base styling

### Backend
- Node.js with Express
- Prisma ORM
- PostgreSQL (Neon Database)
- JWT for authentication
- bcrypt for password hashing

### Integrations Support
- CRM Systems: Salesforce, HubSpot, Zoho
- Storage: Google Drive, Dropbox, OneDrive
- Document Services: DocuSign
- Communication: Email, SMS
- Accounting: QuickBooks, FreshBooks, Xero
- Analytics: Google Analytics
- Payment: Stripe, PayPal
- Time Tracking: Harvest, Toggl
- Tax: Avalara

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
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection string and JWT secret

4. Run Prisma migrations:
   ```bash
   cd ../server
   npx prisma migrate dev
   ```

5. Start the development servers:
   ```bash
   # Start the backend server (from server directory)
   npm start

   # In a new terminal, start the frontend (from client directory)
   cd ../client
   npm start
   ```

### Deploying to Vercel

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. The project includes a `vercel.json` configuration file that handles:
   - Backend API deployment
   - Frontend static file building and serving
   - Prisma client generation
   - Environment configuration

4. Add environment variables in Vercel:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `VERCEL`: Set to "1"
   - `NODE_ENV`: Set to "production"

## Database Schema

### User
- `id`: String (Primary Key, CUID)
- `name`: String (Optional)
- `email`: String (Unique)
- `emailVerified`: DateTime (Optional)
- `password`: String (Hashed)
- `image`: String (Optional)
- `role`: Enum (USER, ADMIN)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `preferences`: Json (Optional)

### UserIntegrations
- `id`: String (Primary Key, CUID)
- `userId`: String (Foreign Key)
- Various integration flags and configurations for:
  - CRM systems (Salesforce, HubSpot, Zoho)
  - Storage services (Google Drive, Dropbox, OneDrive)
  - Document services (DocuSign)
  - Communication services (Email, SMS)

### Business
- `id`: String (Primary Key)
- `name`: String
- `description`: String (Optional)
- `address`: String
- `city`: String
- `province`: String
- `postalCode`: String
- `phone`: String (Optional)
- `email`: String (Optional)
- `website`: String (Optional)
- `businessType`: String[]
- `canadianOwned`: Boolean
- `verified`: Boolean
- `featured`: Boolean

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
