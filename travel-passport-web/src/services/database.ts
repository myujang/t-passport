import { 
  User, 
  State, 
  PlaceOfInterest, 
  UserPassport, 
  UserStamp, 
  PlaceOfInterestWithState, 
  UserStampWithPlace, 
  UserPassportWithState,
  Env 
} from '../types';

export class DatabaseService {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  // User operations
  async createUser(userData: { id: string; email: string; name: string; auth0_id: string }): Promise<User> {
    const result = await this.db.prepare(`
      INSERT INTO users (id, email, name, auth0_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `).bind(userData.id, userData.email, userData.name, userData.auth0_id).first();

    return result as unknown as User;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE auth0_id = ?
    `).bind(auth0Id).first();

    return result as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(id).first();

    return result as User | null;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const setClause = Object.keys(userData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(userData);

    const result = await this.db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `).bind(...values, id).first();

    return result as User | null;
  }

  // State operations
  async getStates(): Promise<State[]> {
    const result = await this.db.prepare(`
      SELECT * FROM states ORDER BY name
    `).all();

    return result.results as unknown as State[];
  }

  async getStateById(id: string): Promise<State | null> {
    const result = await this.db.prepare(`
      SELECT * FROM states WHERE id = ?
    `).bind(id).first();

    return result as State | null;
  }

  // Place of Interest operations
  async getPlacesOfInterest(stateId?: string): Promise<PlaceOfInterestWithState[]> {
    let query = `
      SELECT 
        p.*,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM places_of_interest p
      JOIN states s ON p.state_id = s.id
    `;

    if (stateId) {
      query += ` WHERE p.state_id = ?`;
    }

    query += ` ORDER BY p.name`;

    const result = stateId 
      ? await this.db.prepare(query).bind(stateId).all()
      : await this.db.prepare(query).all();

    return result.results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      state_id: row.state_id,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      image_url: row.image_url,
      stamp_image_url: row.stamp_image_url,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      state: {
        id: row.state_id,
        name: row.state_name,
        code: row.state_code,
        description: row.state_description,
        image_url: row.state_image_url,
        passport_booklet_url: row.state_passport_booklet_url,
        created_at: row.state_created_at,
        updated_at: row.state_updated_at,
      }
    })) as PlaceOfInterestWithState[];
  }

  async getPlaceOfInterestById(id: string): Promise<PlaceOfInterestWithState | null> {
    const result = await this.db.prepare(`
      SELECT 
        p.*,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM places_of_interest p
      JOIN states s ON p.state_id = s.id
      WHERE p.id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      state_id: result.state_id,
      latitude: result.latitude,
      longitude: result.longitude,
      radius: result.radius,
      image_url: result.image_url,
      stamp_image_url: result.stamp_image_url,
      category: result.category,
      created_at: result.created_at,
      updated_at: result.updated_at,
      state: {
        id: result.state_id,
        name: result.state_name,
        code: result.state_code,
        description: result.state_description,
        image_url: result.state_image_url,
        passport_booklet_url: result.state_passport_booklet_url,
        created_at: result.state_created_at,
        updated_at: result.state_updated_at,
      }
    } as PlaceOfInterestWithState;
  }

  async getNearbyPlaces(latitude: number, longitude: number, radius: number = 1000): Promise<PlaceOfInterestWithState[]> {
    // Calculate approximate bounding box for initial filtering
    const latOffset = radius / 111320; // approximate meters per degree latitude
    const lonOffset = radius / (111320 * Math.cos(latitude * Math.PI / 180));

    const result = await this.db.prepare(`
      SELECT 
        p.*,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM places_of_interest p
      JOIN states s ON p.state_id = s.id
      WHERE 
        p.latitude BETWEEN ? AND ? 
        AND p.longitude BETWEEN ? AND ?
      ORDER BY p.name
    `).bind(
      latitude - latOffset,
      latitude + latOffset,
      longitude - lonOffset,
      longitude + lonOffset
    ).all();

    // Filter by actual distance
    return result.results.filter((row: any) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        row.latitude,
        row.longitude
      );
      return distance <= radius;
    }).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      state_id: row.state_id,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      image_url: row.image_url,
      stamp_image_url: row.stamp_image_url,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at,
      state: {
        id: row.state_id,
        name: row.state_name,
        code: row.state_code,
        description: row.state_description,
        image_url: row.state_image_url,
        passport_booklet_url: row.state_passport_booklet_url,
        created_at: row.state_created_at,
        updated_at: row.state_updated_at,
      }
    })) as PlaceOfInterestWithState[];
  }

  // User Passport operations
  async getUserPassports(userId: string): Promise<UserPassportWithState[]> {
    const result = await this.db.prepare(`
      SELECT 
        up.*,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM user_passports up
      JOIN states s ON up.state_id = s.id
      WHERE up.user_id = ?
      ORDER BY up.purchased_at DESC
    `).bind(userId).all();

    const passports = result.results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      state_id: row.state_id,
      purchased_at: row.purchased_at,
      is_active: row.is_active,
      completion_percentage: row.completion_percentage,
      state: {
        id: row.state_id,
        name: row.state_name,
        code: row.state_code,
        description: row.state_description,
        image_url: row.state_image_url,
        passport_booklet_url: row.state_passport_booklet_url,
        created_at: row.state_created_at,
        updated_at: row.state_updated_at,
      },
      stamps: []
    })) as UserPassportWithState[];

    // Get stamps for each passport
    for (const passport of passports) {
      const stamps = await this.getUserStampsByState(userId, passport.state_id);
      passport.stamps = stamps;
    }

    return passports;
  }

  async createUserPassport(userId: string, stateId: string): Promise<UserPassport> {
    const id = crypto.randomUUID();
    const result = await this.db.prepare(`
      INSERT INTO user_passports (id, user_id, state_id, purchased_at, is_active, completion_percentage)
      VALUES (?, ?, ?, datetime('now'), true, 0)
      RETURNING *
    `).bind(id, userId, stateId).first();

    return result as unknown as UserPassport;
  }

  // User Stamp operations
  async getUserStamps(userId: string, passportId?: string): Promise<UserStampWithPlace[]> {
    let query = `
      SELECT 
        us.*,
        p.name as place_name,
        p.description as place_description,
        p.latitude as place_latitude,
        p.longitude as place_longitude,
        p.radius as place_radius,
        p.image_url as place_image_url,
        p.stamp_image_url as place_stamp_image_url,
        p.category as place_category,
        p.created_at as place_created_at,
        p.updated_at as place_updated_at,
        s.id as state_id,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM user_stamps us
      JOIN places_of_interest p ON us.place_of_interest_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE us.user_id = ?
    `;

    if (passportId) {
      query += ` AND p.state_id = (SELECT state_id FROM user_passports WHERE id = ?)`;
    }

    query += ` ORDER BY us.collected_at DESC`;

    const result = passportId
      ? await this.db.prepare(query).bind(userId, passportId).all()
      : await this.db.prepare(query).bind(userId).all();

    return result.results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_of_interest_id: row.place_of_interest_id,
      collected_at: row.collected_at,
      latitude: row.latitude,
      longitude: row.longitude,
      image_url: row.image_url,
      place_of_interest: {
        id: row.place_of_interest_id,
        name: row.place_name,
        description: row.place_description,
        state_id: row.state_id,
        latitude: row.place_latitude,
        longitude: row.place_longitude,
        radius: row.place_radius,
        image_url: row.place_image_url,
        stamp_image_url: row.place_stamp_image_url,
        category: row.place_category,
        created_at: row.place_created_at,
        updated_at: row.place_updated_at,
        state: {
          id: row.state_id,
          name: row.state_name,
          code: row.state_code,
          description: row.state_description,
          image_url: row.state_image_url,
          passport_booklet_url: row.state_passport_booklet_url,
          created_at: row.state_created_at,
          updated_at: row.state_updated_at,
        }
      }
    })) as UserStampWithPlace[];
  }

  async getUserStampsByState(userId: string, stateId: string): Promise<UserStampWithPlace[]> {
    const result = await this.db.prepare(`
      SELECT 
        us.*,
        p.name as place_name,
        p.description as place_description,
        p.latitude as place_latitude,
        p.longitude as place_longitude,
        p.radius as place_radius,
        p.image_url as place_image_url,
        p.stamp_image_url as place_stamp_image_url,
        p.category as place_category,
        p.created_at as place_created_at,
        p.updated_at as place_updated_at,
        s.id as state_id,
        s.name as state_name,
        s.code as state_code,
        s.description as state_description,
        s.image_url as state_image_url,
        s.passport_booklet_url as state_passport_booklet_url,
        s.created_at as state_created_at,
        s.updated_at as state_updated_at
      FROM user_stamps us
      JOIN places_of_interest p ON us.place_of_interest_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE us.user_id = ? AND s.id = ?
      ORDER BY us.collected_at DESC
    `).bind(userId, stateId).all();

    return result.results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_of_interest_id: row.place_of_interest_id,
      collected_at: row.collected_at,
      latitude: row.latitude,
      longitude: row.longitude,
      image_url: row.image_url,
      place_of_interest: {
        id: row.place_of_interest_id,
        name: row.place_name,
        description: row.place_description,
        state_id: row.state_id,
        latitude: row.place_latitude,
        longitude: row.place_longitude,
        radius: row.place_radius,
        image_url: row.place_image_url,
        stamp_image_url: row.place_stamp_image_url,
        category: row.place_category,
        created_at: row.place_created_at,
        updated_at: row.place_updated_at,
        state: {
          id: row.state_id,
          name: row.state_name,
          code: row.state_code,
          description: row.state_description,
          image_url: row.state_image_url,
          passport_booklet_url: row.state_passport_booklet_url,
          created_at: row.state_created_at,
          updated_at: row.state_updated_at,
        }
      }
    })) as UserStampWithPlace[];
  }

  async createUserStamp(stampData: {
    userId: string;
    placeOfInterestId: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
  }): Promise<UserStamp> {
    const id = crypto.randomUUID();
    const result = await this.db.prepare(`
      INSERT INTO user_stamps (id, user_id, place_of_interest_id, collected_at, latitude, longitude, image_url)
      VALUES (?, ?, ?, datetime('now'), ?, ?, ?)
      RETURNING *
    `).bind(
      id,
      stampData.userId,
      stampData.placeOfInterestId,
      stampData.latitude,
      stampData.longitude,
      stampData.imageUrl || null
    ).first();

    return result as unknown as UserStamp;
  }

  async hasUserStamp(userId: string, placeOfInterestId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_stamps
      WHERE user_id = ? AND place_of_interest_id = ?
    `).bind(userId, placeOfInterestId).first();

    return result ? (result as any).count > 0 : false;
  }

  // Utility methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  async updatePassportCompletion(userId: string, stateId: string): Promise<void> {
    // Get total places in state
    const totalPlaces = await this.db.prepare(`
      SELECT COUNT(*) as count FROM places_of_interest WHERE state_id = ?
    `).bind(stateId).first();

    // Get user's collected stamps in state
    const collectedStamps = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_stamps us
      JOIN places_of_interest p ON us.place_of_interest_id = p.id
      WHERE us.user_id = ? AND p.state_id = ?
    `).bind(userId, stateId).first();

    if (totalPlaces && collectedStamps) {
      const percentage = ((collectedStamps as any).count / (totalPlaces as any).count) * 100;

      await this.db.prepare(`
        UPDATE user_passports 
        SET completion_percentage = ?, updated_at = datetime('now')
        WHERE user_id = ? AND state_id = ?
      `).bind(percentage, userId, stateId).run();
    }
  }
}