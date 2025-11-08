import { describe, test, expect, beforeEach } from '@jest/globals';
import { authorizeOwner } from '../../src/middleware/auth.js';

describe('Auth Middleware - Basic Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
      path: '/test',
      user: {}
    };
    res = {
      statusCode: 200,
      _status: null,
      _json: null,
      status: function(code) {
        this._status = code;
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this._json = data;
        return this;
      }
    };
    next = () => { next.called = true; };
    next.called = false;
  });

  describe('authorizeOwner', () => {
    test('should authorize when user is the author', () => {
      req.user = { username: 'testuser' };
      req.params.author = 'testuser';

      authorizeOwner(req, res, next);

      expect(next.called).toBe(true);
      expect(res._status).toBeNull();
    });

    test('should reject when user is not the author', () => {
      req.user = { username: 'testuser' };
      req.params.author = 'otheruser';

      authorizeOwner(req, res, next);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({
        error: 'Forbidden: You can only access your own blueprints',
      });
      expect(next.called).toBe(false);
    });

    test('should handle different usernames correctly', () => {
      req.user = { username: 'alice' };
      req.params.author = 'bob';

      authorizeOwner(req, res, next);

      expect(res._status).toBe(403);
      expect(next.called).toBe(false);
    });

    test('should allow user to access their own resources', () => {
      req.user = { username: 'john_doe' };
      req.params.author = 'john_doe';

      authorizeOwner(req, res, next);

      expect(next.called).toBe(true);
    });
  });
});
