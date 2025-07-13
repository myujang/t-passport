# Travel Passport Malaysia

A digital passport system for tourists to collect stamps from places of interest across Malaysia using GPS-based verification.

## Project Structure

```
travel-passport/
├── travel-passport-mobile/     # React Native Expo mobile app
├── travel-passport-web/        # Cloudflare Workers web app with Hono
└── README.md                   # This file
```

## Features

### Mobile App (React Native Expo)
- **Authentication**: Auth0 integration for secure user authentication
- **GPS-based Stamp Collection**: Collect stamps when within the specified radius of places of interest
- **State-specific Passports**: Purchase and manage passports for different Malaysian states
- **Real-time Location Tracking**: Find nearby places of interest
- **Passport Management**: View collected stamps and completion progress

### Web App (Cloudflare Workers + Hono)
- **Landing Page**: Beautiful landing page showcasing the app
- **REST API**: Complete API for mobile app integration
- **Admin Dashboard**: Basic admin panel for system management
- **D1 Database**: Cloudflare D1 database for data storage
- **Auth0 Integration**: Backend authentication handling

## Technology Stack

### Mobile App
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **Expo Location**: GPS and location services
- **Axios**: HTTP client for API requests

### Web App
- **Cloudflare Workers**: Serverless compute platform
- **Hono**: Fast, lightweight web framework
- **TypeScript**: Type-safe JavaScript
- **Cloudflare D1**: Serverless SQL database
- **Auth0**: Authentication and authorization

## Database Schema

### Users
- `id` (TEXT PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `name` (TEXT)
- `auth0_id` (TEXT UNIQUE)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### States
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `code` (TEXT UNIQUE)
- `description` (TEXT)
- `image_url` (TEXT)
- `passport_booklet_url` (TEXT)

### Places of Interest
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `description` (TEXT)
- `state_id` (TEXT FOREIGN KEY)
- `latitude` (REAL)
- `longitude` (REAL)
- `radius` (INTEGER) - in meters
- `image_url` (TEXT)
- `stamp_image_url` (TEXT)
- `category` (TEXT)

### User Passports
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `state_id` (TEXT FOREIGN KEY)
- `purchased_at` (DATETIME)
- `is_active` (BOOLEAN)
- `completion_percentage` (REAL)

### User Stamps
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `place_of_interest_id` (TEXT FOREIGN KEY)
- `collected_at` (DATETIME)
- `latitude` (REAL)
- `longitude` (REAL)
- `image_url` (TEXT)

## API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/register` - Register new user

### States
- `GET /api/states` - Get all states
- `GET /api/states/:id` - Get specific state

### Places of Interest
- `GET /api/places-of-interest` - Get all places (optional stateId filter)
- `GET /api/places-of-interest/nearby` - Get nearby places (requires lat/lng)
- `GET /api/places-of-interest/:id` - Get specific place

### User Passports
- `GET /api/user-passports` - Get user's passports
- `POST /api/user-passports` - Purchase new passport

### User Stamps
- `GET /api/user-stamps` - Get user's stamps (optional passportId filter)
- `POST /api/stamps/collect` - Collect stamp at location

### System
- `GET /api/health` - Health check endpoint

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Auth0 account
- Cloudflare account

### Mobile App Setup

1. Navigate to the mobile app directory:
   ```bash
   cd travel-passport-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update Auth0 configuration in `src/services/auth.ts`:
   ```typescript
   const AUTH0_DOMAIN = 'your-auth0-domain';
   const AUTH0_CLIENT_ID = 'your-auth0-client-id';
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Web App Setup

1. Navigate to the web app directory:
   ```bash
   cd travel-passport-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `wrangler.jsonc` with your configuration:
   ```json
   {
     "vars": {
       "AUTH0_DOMAIN": "your-auth0-domain",
       "AUTH0_CLIENT_ID": "your-auth0-client-id",
       "AUTH0_CLIENT_SECRET": "your-auth0-client-secret"
     },
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "travel-passport-db",
         "database_id": "your-database-id"
       }
     ]
   }
   ```

4. Create D1 database:
   ```bash
   npx wrangler d1 create travel-passport-db
   ```

5. Initialize database schema:
   ```bash
   npx wrangler d1 execute travel-passport-db --file=src/db/schema.sql
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Auth0 Configuration

1. Create Auth0 application for mobile app:
   - Application Type: Native
   - Add callback URL: `travel-passport://auth`

2. Create Auth0 application for web app:
   - Application Type: Regular Web Application
   - Add callback URL: `https://your-domain.com/callback`

3. Create Auth0 API:
   - Identifier: `https://travelpassport.my/api`
   - Enable RBAC if needed

## Deployment

### Mobile App
- Build for iOS: `expo build:ios`
- Build for Android: `expo build:android`
- Submit to app stores using Expo Application Services (EAS)

### Web App
- Deploy to Cloudflare Workers: `npm run deploy`
- Set up custom domain in Cloudflare dashboard
- Configure environment variables and secrets

## Malaysian States Included

The system includes all 16 Malaysian states and territories:

1. **Johor** - The southern gateway to Malaysia
2. **Kedah** - The rice bowl of Malaysia
3. **Kelantan** - The cradle of Malay culture
4. **Melaka** - The historic state
5. **Negeri Sembilan** - The cultural heritage state
6. **Pahang** - The largest state in Peninsular Malaysia
7. **Perak** - The silver state
8. **Perlis** - The smallest state in Malaysia
9. **Penang** - The Pearl of the Orient
10. **Sabah** - Land below the wind
11. **Sarawak** - Land of the hornbills
12. **Selangor** - The most developed state
13. **Terengganu** - The state of turtles
14. **Kuala Lumpur** - The capital city
15. **Labuan** - The duty-free island
16. **Putrajaya** - The administrative capital

## Sample Places of Interest

### Kuala Lumpur
- **Petronas Twin Towers** - Iconic twin towers (100m radius)
- **Batu Caves** - Hindu temple caves (150m radius)
- **KL Tower** - Telecommunications tower (100m radius)
- **Central Market** - Cultural arts market (50m radius)
- **Merdeka Square** - Historic independence square (75m radius)

### Penang
- **George Town** - UNESCO World Heritage Site (200m radius)
- **Penang Hill** - Hill station with views (150m radius)
- **Kek Lok Si Temple** - Largest Buddhist temple (100m radius)
- **Gurney Drive** - Famous seafront promenade (100m radius)
- **Clan Houses** - Traditional Chinese houses (75m radius)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@travelpassport.my or join our community Discord.

---

**Travel Passport Malaysia** - Discover the beauty of Malaysia, one stamp at a time! 🇲🇾
