import { supabase } from './supabaseClient';
import { User as DBUser } from './supabaseClient';
import { User, UserRole } from '../types';

/**
 * Authentication Service
 * Handles user login/logout and session management
 */

// Convert DB User to App User type
const convertDBUserToAppUser = (dbUser: DBUser): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    password: dbUser.password, // In production, never expose this
    role: dbUser.role as UserRole,
    phone: dbUser.phone || undefined,
    active: dbUser.active,
  };
};

/**
 * Login user
 * @param username - Username
 * @param password - Password (plain text - in production use proper auth)
 * @returns User object if successful, null otherwise
 */
export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // In production, use Supabase Auth or proper hashing
      .eq('active', true)
      .single();

    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Store session in localStorage
    localStorage.setItem('currentUser', JSON.stringify(convertDBUserToAppUser(data)));

    return convertDBUserToAppUser(data);
  } catch (err) {
    console.error('Login exception:', err);
    return null;
  }
};

/**
 * Logout user
 */
export const logout = (): void => {
  localStorage.removeItem('currentUser');
};

/**
 * Get current user from session
 */
export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * Check if current user is admin
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === UserRole.Admin;
};
