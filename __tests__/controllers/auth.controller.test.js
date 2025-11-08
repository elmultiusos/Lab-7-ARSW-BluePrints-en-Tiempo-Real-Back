import { describe, test, expect, beforeEach } from '@jest/globals';
import { getBpKey } from '../../src/models/database.js';

describe('Database Utilities', () => {
  describe('getBpKey', () => {
    test('should generate correct blueprint key', () => {
      const key = getBpKey('testuser', 'test-blueprint');
      expect(key).toBe('testuser:test-blueprint');
    });

    test('should handle different authors and names', () => {
      expect(getBpKey('john', 'house-plan')).toBe('john:house-plan');
      expect(getBpKey('alice', 'car-design')).toBe('alice:car-design');
    });

    test('should create unique keys for different combinations', () => {
      const key1 = getBpKey('user1', 'blueprint1');
      const key2 = getBpKey('user2', 'blueprint1');
      const key3 = getBpKey('user1', 'blueprint2');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    test('should handle special characters', () => {
      const key = getBpKey('user-name', 'blue_print');
      expect(key).toBe('user-name:blue_print');
    });
  });
});
