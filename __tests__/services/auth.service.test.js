import { describe, test, expect, beforeEach } from '@jest/globals';
import { users } from '../../src/models/database.js';

describe('AuthService - Basic Tests', () => {
  const mockUsername = 'testuser';
  const mockPassword = 'testpass123';

  beforeEach(() => {
    users.clear();
  });

  describe('User Storage', () => {
    test('should store user in database', () => {
      const user = {
        username: mockUsername,
        password: 'hashed_password',
        createdAt: new Date().toISOString()
      };
      
      users.set(mockUsername, user);
      
      expect(users.has(mockUsername)).toBe(true);
      expect(users.get(mockUsername)).toEqual(user);
    });

    test('should check if username exists', () => {
      expect(users.has(mockUsername)).toBe(false);
      
      users.set(mockUsername, { username: mockUsername, password: 'hash' });
      
      expect(users.has(mockUsername)).toBe(true);
    });

    test('should retrieve stored user', () => {
      const user = { username: mockUsername, password: 'hash', createdAt: '2025-01-01' };
      users.set(mockUsername, user);
      
      const retrieved = users.get(mockUsername);
      expect(retrieved).toEqual(user);
    });

    test('should return undefined for non-existent user', () => {
      const retrieved = users.get('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('User Management', () => {
    test('should handle multiple users', () => {
      users.set('user1', { username: 'user1', password: 'hash1' });
      users.set('user2', { username: 'user2', password: 'hash2' });
      users.set('user3', { username: 'user3', password: 'hash3' });
      
      expect(users.size).toBe(3);
      expect(users.has('user1')).toBe(true);
      expect(users.has('user2')).toBe(true);
      expect(users.has('user3')).toBe(true);
    });

    test('should clear all users', () => {
      users.set('user1', { username: 'user1' });
      users.set('user2', { username: 'user2' });
      
      expect(users.size).toBe(2);
      
      users.clear();
      
      expect(users.size).toBe(0);
    });
  });
});
