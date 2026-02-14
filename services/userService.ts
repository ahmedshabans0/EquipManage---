import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

/**
 * User Service
 * CRUD operations for system users
 */

/**
 * Get all users
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)  // Exclude soft deleted users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map(convertDBUserToAppUser);
  } catch (err) {
    console.error('Exception fetching users:', err);
    return [];
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching user:', error);
      return null;
    }

    return convertDBUserToAppUser(data);
  } catch (err) {
    console.error('Exception fetching user:', err);
    return null;
  }
};

/**
 * Create new user
 */
export const createUser = async (user: Omit<User, 'id'>): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        username: user.username,
        password: user.password, // In production, hash this!
        role: user.role,
        phone: user.phone || null,
        active: user.active,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating user:', error);
      return null;
    }

    return convertDBUserToAppUser(data);
  } catch (err) {
    console.error('Exception creating user:', err);
    return null;
  }
};

/**
 * Update user
 */
export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating user:', error);
      return null;
    }

    return convertDBUserToAppUser(data);
  } catch (err) {
    console.error('Exception updating user:', err);
    return null;
  }
};

/**
 * Delete user (Soft Delete)
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    // Soft delete - set deleted_at timestamp instead of actual deletion
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting user:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception soft deleting user:', err);
    return false;
  }
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (id: string, active: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling user status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception toggling user status:', err);
    return false;
  }
};

// Helper function to convert DB format to App format
const convertDBUserToAppUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    password: dbUser.password,
    role: dbUser.role as UserRole,
    phone: dbUser.phone || undefined,
    active: dbUser.active,
  };
};
