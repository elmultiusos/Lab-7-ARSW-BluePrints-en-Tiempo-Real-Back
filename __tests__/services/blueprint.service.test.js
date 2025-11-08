import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BlueprintService } from '../../src/services/blueprint.service.js';
import { blueprints, getBpKey } from '../../src/models/database.js';

// Mock database
jest.mock('../../src/models/database.js', () => ({
  blueprints: new Map(),
  getBpKey: (author, name) => `${author}:${name}`,
}));

describe('BlueprintService', () => {
  let blueprintService;
  const mockAuthor = 'testuser';
  const mockName = 'test-blueprint';
  const mockPoints = [
    { x: 10, y: 20 },
    { x: 30, y: 40 },
  ];

  beforeEach(() => {
    blueprintService = new BlueprintService();
    blueprints.clear();
    jest.clearAllMocks();
  });

  describe('getAllByAuthor', () => {
    test('should return all blueprints for an author', () => {
      const bp1 = { author: mockAuthor, name: 'bp1', points: [] };
      const bp2 = { author: mockAuthor, name: 'bp2', points: [] };
      const bp3 = { author: 'otheruser', name: 'bp3', points: [] };

      blueprints.set(getBpKey(mockAuthor, 'bp1'), bp1);
      blueprints.set(getBpKey(mockAuthor, 'bp2'), bp2);
      blueprints.set(getBpKey('otheruser', 'bp3'), bp3);

      const result = blueprintService.getAllByAuthor(mockAuthor);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(bp1);
      expect(result).toContainEqual(bp2);
      expect(result).not.toContainEqual(bp3);
    });

    test('should return empty array when author has no blueprints', () => {
      const result = blueprintService.getAllByAuthor('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getByAuthorAndName', () => {
    test('should return existing blueprint', () => {
      const mockBp = { author: mockAuthor, name: mockName, points: mockPoints };
      blueprints.set(getBpKey(mockAuthor, mockName), mockBp);

      const result = blueprintService.getByAuthorAndName(mockAuthor, mockName);

      expect(result).toEqual(mockBp);
    });

    test('should return empty blueprint when not found', () => {
      const result = blueprintService.getByAuthorAndName(mockAuthor, 'nonexistent');

      expect(result).toEqual({
        author: mockAuthor,
        name: 'nonexistent',
        points: [],
      });
    });
  });

  describe('create', () => {
    test('should create a new blueprint', () => {
      const result = blueprintService.create(mockAuthor, mockName, mockPoints);

      expect(result).toEqual({
        author: mockAuthor,
        name: mockName,
        points: mockPoints,
      });
      expect(blueprints.has(getBpKey(mockAuthor, mockName))).toBe(true);
    });

    test('should create blueprint with empty points if not provided', () => {
      const result = blueprintService.create(mockAuthor, mockName);

      expect(result.points).toEqual([]);
    });

    test('should throw error when blueprint already exists', () => {
      blueprints.set(getBpKey(mockAuthor, mockName), { author: mockAuthor, name: mockName, points: [] });

      expect(() => blueprintService.create(mockAuthor, mockName)).toThrow('Blueprint already exists');
    });
  });

  describe('update', () => {
    test('should update existing blueprint', () => {
      const oldBp = { author: mockAuthor, name: mockName, points: [] };
      blueprints.set(getBpKey(mockAuthor, mockName), oldBp);

      const result = blueprintService.update(mockAuthor, mockName, mockPoints);

      expect(result).toEqual({
        author: mockAuthor,
        name: mockName,
        points: mockPoints,
      });
      expect(blueprints.get(getBpKey(mockAuthor, mockName))).toEqual(result);
    });

    test('should create blueprint if it does not exist', () => {
      const result = blueprintService.update(mockAuthor, mockName, mockPoints);

      expect(result).toEqual({
        author: mockAuthor,
        name: mockName,
        points: mockPoints,
      });
      expect(blueprints.has(getBpKey(mockAuthor, mockName))).toBe(true);
    });
  });

  describe('delete', () => {
    test('should delete existing blueprint', () => {
      blueprints.set(getBpKey(mockAuthor, mockName), { author: mockAuthor, name: mockName, points: [] });

      const result = blueprintService.delete(mockAuthor, mockName);

      expect(result).toBe(true);
      expect(blueprints.has(getBpKey(mockAuthor, mockName))).toBe(false);
    });

    test('should throw error when blueprint does not exist', () => {
      expect(() => blueprintService.delete(mockAuthor, 'nonexistent')).toThrow('Blueprint not found');
    });
  });

  describe('addPoint', () => {
    test('should add point to existing blueprint', () => {
      const initialPoints = [{ x: 10, y: 20 }];
      blueprints.set(getBpKey(mockAuthor, mockName), {
        author: mockAuthor,
        name: mockName,
        points: initialPoints,
      });

      const newPoint = { x: 30, y: 40 };
      const result = blueprintService.addPoint(mockAuthor, mockName, newPoint);

      expect(result.points).toHaveLength(2);
      expect(result.points).toContainEqual(newPoint);
    });

    test('should create blueprint if it does not exist', () => {
      const newPoint = { x: 10, y: 20 };
      const result = blueprintService.addPoint(mockAuthor, mockName, newPoint);

      expect(result).toEqual({
        author: mockAuthor,
        name: mockName,
        points: [newPoint],
      });
    });

    test('should throw error when maximum points limit is reached', () => {
      const maxPoints = Array(1000).fill({ x: 0, y: 0 });
      blueprints.set(getBpKey(mockAuthor, mockName), {
        author: mockAuthor,
        name: mockName,
        points: maxPoints,
      });

      expect(() => blueprintService.addPoint(mockAuthor, mockName, { x: 1, y: 1 })).toThrow(
        'Maximum points limit reached'
      );
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      blueprints.set(getBpKey('user1', 'bp1'), { author: 'user1', name: 'bp1', points: [{ x: 1, y: 1 }] });
      blueprints.set(getBpKey('user1', 'bp2'), { author: 'user1', name: 'bp2', points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] });
      blueprints.set(getBpKey('user2', 'bp3'), { author: 'user2', name: 'bp3', points: [{ x: 1, y: 1 }] });

      const result = blueprintService.getStats();

      expect(result.blueprints.total).toBe(3);
      expect(result.blueprints.byAuthor['user1']).toBe(2);
      expect(result.blueprints.byAuthor['user2']).toBe(1);
      expect(result.points.total).toBe(4);
      expect(result.points.average).toBeCloseTo(1.3, 1);
    });

    test('should return zero statistics when no blueprints exist', () => {
      const result = blueprintService.getStats();

      expect(result.blueprints.total).toBe(0);
      expect(result.points.total).toBe(0);
      expect(result.points.average).toBe(0);
    });
  });
});
