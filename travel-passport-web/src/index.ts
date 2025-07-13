import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseService } from './services/database';
import { 
  Env, 
  AppContext, 
  APIResponse, 
  User, 
  StampCollectionRequest, 
  StampCollectionResult 
} from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/api/*', cors({
  origin: ['https://travelpassport.my', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Auth middleware
async function authMiddleware(c: AppContext, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json<APIResponse>({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify Auth0 token
    const response = await fetch(`https://${c.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json<APIResponse>({ success: false, error: 'Invalid token' }, 401);
    }

    const userInfo = await response.json();
    
    // Get or create user in database
    const db = new DatabaseService(c.env);
    let user = await db.getUserByAuth0Id(userInfo.sub);
    
    if (!user) {
      user = await db.createUser({
        id: crypto.randomUUID(),
        email: userInfo.email,
        name: userInfo.name,
        auth0_id: userInfo.sub,
      });
    }

    // Store user in context
    c.set('user', user);
    c.set('token', token);
    
    await next();
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Authentication failed' }, 401);
  }
}

// Static file serving for landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Passport Malaysia</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .header {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 1rem 0;
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .nav {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .logo {
                font-size: 1.5rem;
                font-weight: bold;
                color: white;
            }
            
            .nav-links {
                display: flex;
                gap: 2rem;
            }
            
            .nav-links a {
                color: white;
                text-decoration: none;
                transition: opacity 0.3s;
            }
            
            .nav-links a:hover {
                opacity: 0.8;
            }
            
            .hero {
                text-align: center;
                padding: 6rem 0;
                color: white;
            }
            
            .hero h1 {
                font-size: 3.5rem;
                margin-bottom: 1rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .hero p {
                font-size: 1.2rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }
            
            .cta-button {
                display: inline-block;
                background: #2E7D32;
                color: white;
                padding: 1rem 2rem;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            
            .features {
                padding: 4rem 0;
                background: white;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-top: 2rem;
            }
            
            .feature-card {
                text-align: center;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
            }
            
            .feature-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            
            .feature-card h3 {
                color: #2E7D32;
                margin-bottom: 1rem;
            }
            
            .states {
                padding: 4rem 0;
                background: #f8f9fa;
            }
            
            .states h2 {
                text-align: center;
                margin-bottom: 2rem;
                color: #2E7D32;
            }
            
            .footer {
                background: #333;
                color: white;
                text-align: center;
                padding: 2rem 0;
            }
            
            @media (max-width: 768px) {
                .hero h1 {
                    font-size: 2.5rem;
                }
                
                .nav-links {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="container">
                <nav class="nav">
                    <div class="logo">🇲🇾 Travel Passport</div>
                    <div class="nav-links">
                        <a href="#features">Features</a>
                        <a href="#states">States</a>
                        <a href="#download">Download</a>
                        <a href="/admin">Admin</a>
                    </div>
                </nav>
            </div>
        </header>
        
        <section class="hero">
            <div class="container">
                <h1>Discover Malaysia</h1>
                <p>Collect digital stamps from amazing places across all Malaysian states</p>
                <a href="#download" class="cta-button">Get Started</a>
            </div>
        </section>
        
        <section id="features" class="features">
            <div class="container">
                <h2>How It Works</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>Download the App</h3>
                        <p>Get the Travel Passport mobile app and create your account</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📘</div>
                        <h3>Buy State Passports</h3>
                        <p>Purchase digital passports for Malaysian states you want to explore</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📍</div>
                        <h3>Visit & Collect</h3>
                        <p>Visit places of interest and collect stamps using GPS verification</p>
                    </div>
                </div>
            </div>
        </section>
        
        <section id="states" class="states">
            <div class="container">
                <h2>Explore All 16 States & Territories</h2>
                <p style="text-align: center; margin-bottom: 2rem;">From the bustling streets of Kuala Lumpur to the pristine beaches of Sabah, discover Malaysia's rich cultural heritage and natural wonders.</p>
            </div>
        </section>
        
        <section id="download" class="features">
            <div class="container">
                <h2>Download the App</h2>
                <div style="text-align: center;">
                    <p>Available on iOS and Android</p>
                    <div style="margin-top: 2rem;">
                        <a href="#" class="cta-button" style="margin: 0 1rem;">App Store</a>
                        <a href="#" class="cta-button" style="margin: 0 1rem;">Google Play</a>
                    </div>
                </div>
            </div>
        </section>
        
        <footer class="footer">
            <div class="container">
                <p>&copy; 2024 Travel Passport Malaysia. All rights reserved.</p>
            </div>
        </footer>
    </body>
    </html>
  `);
});

// API Routes

// Auth endpoints
app.get('/api/auth/me', authMiddleware, async (c: AppContext) => {
  const user = c.get('user') as User;
  return c.json<APIResponse<User>>({ success: true, data: user });
});

app.post('/api/auth/register', authMiddleware, async (c: AppContext) => {
  const user = c.get('user') as User;
  return c.json<APIResponse<User>>({ success: true, data: user });
});

// States endpoints
app.get('/api/states', authMiddleware, async (c: AppContext) => {
  try {
    const db = new DatabaseService(c.env);
    const states = await db.getStates();
    return c.json<APIResponse>({ success: true, data: states });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch states' }, 500);
  }
});

app.get('/api/states/:id', authMiddleware, async (c: AppContext) => {
  try {
    const db = new DatabaseService(c.env);
    const state = await db.getStateById(c.req.param('id'));
    
    if (!state) {
      return c.json<APIResponse>({ success: false, error: 'State not found' }, 404);
    }
    
    return c.json<APIResponse>({ success: true, data: state });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch state' }, 500);
  }
});

// Places of Interest endpoints
app.get('/api/places-of-interest', authMiddleware, async (c: AppContext) => {
  try {
    const db = new DatabaseService(c.env);
    const stateId = c.req.query('stateId');
    const places = await db.getPlacesOfInterest(stateId);
    return c.json<APIResponse>({ success: true, data: places });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch places' }, 500);
  }
});

app.get('/api/places-of-interest/nearby', authMiddleware, async (c: AppContext) => {
  try {
    const latitude = parseFloat(c.req.query('latitude') || '0');
    const longitude = parseFloat(c.req.query('longitude') || '0');
    const radius = parseInt(c.req.query('radius') || '1000');
    
    if (!latitude || !longitude) {
      return c.json<APIResponse>({ success: false, error: 'Latitude and longitude are required' }, 400);
    }
    
    const db = new DatabaseService(c.env);
    const places = await db.getNearbyPlaces(latitude, longitude, radius);
    return c.json<APIResponse>({ success: true, data: places });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch nearby places' }, 500);
  }
});

app.get('/api/places-of-interest/:id', authMiddleware, async (c: AppContext) => {
  try {
    const db = new DatabaseService(c.env);
    const place = await db.getPlaceOfInterestById(c.req.param('id'));
    
    if (!place) {
      return c.json<APIResponse>({ success: false, error: 'Place not found' }, 404);
    }
    
    return c.json<APIResponse>({ success: true, data: place });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch place' }, 500);
  }
});

// User Passports endpoints
app.get('/api/user-passports', authMiddleware, async (c: AppContext) => {
  try {
    const user = c.get('user') as User;
    const db = new DatabaseService(c.env);
    const passports = await db.getUserPassports(user.id);
    return c.json<APIResponse>({ success: true, data: passports });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch passports' }, 500);
  }
});

app.post('/api/user-passports', authMiddleware, async (c: AppContext) => {
  try {
    const user = c.get('user') as User;
    const { stateId } = await c.req.json();
    
    if (!stateId) {
      return c.json<APIResponse>({ success: false, error: 'State ID is required' }, 400);
    }
    
    const db = new DatabaseService(c.env);
    const passport = await db.createUserPassport(user.id, stateId);
    return c.json<APIResponse>({ success: true, data: passport });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to create passport' }, 500);
  }
});

// User Stamps endpoints
app.get('/api/user-stamps', authMiddleware, async (c: AppContext) => {
  try {
    const user = c.get('user') as User;
    const passportId = c.req.query('passportId');
    const db = new DatabaseService(c.env);
    const stamps = await db.getUserStamps(user.id, passportId);
    return c.json<APIResponse>({ success: true, data: stamps });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch stamps' }, 500);
  }
});

app.post('/api/stamps/collect', authMiddleware, async (c: AppContext) => {
  try {
    const user = c.get('user') as User;
    const { placeOfInterestId, latitude, longitude, imageUrl }: StampCollectionRequest = await c.req.json();
    
    if (!placeOfInterestId || !latitude || !longitude) {
      return c.json<APIResponse>({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const db = new DatabaseService(c.env);
    
    // Check if user already has this stamp
    const hasStamp = await db.hasUserStamp(user.id, placeOfInterestId);
    if (hasStamp) {
      return c.json<APIResponse<StampCollectionResult>>({ 
        success: true, 
        data: { success: false, message: 'You already have this stamp!' }
      });
    }
    
    // Get place details
    const place = await db.getPlaceOfInterestById(placeOfInterestId);
    if (!place) {
      return c.json<APIResponse>({ success: false, error: 'Place not found' }, 404);
    }
    
    // Calculate distance
    const distance = calculateDistance(latitude, longitude, place.latitude, place.longitude);
    
    if (distance > place.radius) {
      return c.json<APIResponse<StampCollectionResult>>({ 
        success: true, 
        data: { 
          success: false, 
          message: `You are ${Math.round(distance)}m away from ${place.name}. You need to be within ${place.radius}m to collect this stamp.`
        }
      });
    }
    
    // Create stamp
    const stamp = await db.createUserStamp({
      userId: user.id,
      placeOfInterestId,
      latitude,
      longitude,
      imageUrl
    });
    
    // Update passport completion
    await db.updatePassportCompletion(user.id, place.state_id);
    
    return c.json<APIResponse<StampCollectionResult>>({ 
      success: true, 
      data: { 
        success: true, 
        message: `Successfully collected stamp from ${place.name}!`,
        stamp
      }
    });
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to collect stamp' }, 500);
  }
});

// Admin panel (basic)
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Travel Passport Admin</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #2E7D32; }
            .section { margin: 20px 0; }
            .section h2 { color: #555; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .stat-card { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center;
                border-left: 4px solid #2E7D32;
            }
            .stat-number { font-size: 2em; font-weight: bold; color: #2E7D32; }
            .stat-label { color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Travel Passport Admin Dashboard</h1>
            
            <div class="section">
                <h2>System Statistics</h2>
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">16</div>
                        <div class="stat-label">States Available</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">10+</div>
                        <div class="stat-label">Places of Interest</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Stamps Collected</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Quick Actions</h2>
                <p>• View database schema: <a href="/api/schema">Database Schema</a></p>
                <p>• API documentation: <a href="/api/docs">API Docs</a></p>
                <p>• System health: <a href="/api/health">Health Check</a></p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json<APIResponse>({ 
    success: true, 
    data: { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'development'
    }
  });
});

// Utility function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default app;
