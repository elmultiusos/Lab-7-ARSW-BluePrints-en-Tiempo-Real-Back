// In-memory storage
export const blueprints = new Map(); // key: "author:name" -> blueprint
export const users = new Map(); // key: username -> { username, password, createdAt }

// Helper to get blueprint key
export const getBpKey = (author, name) => `${author}:${name}`;

// Initialize with some sample data
blueprints.set(getBpKey('juan', 'plano-1'), {
  author: 'juan',
  name: 'plano-1',
  points: [{ x: 10, y: 10 }, { x: 40, y: 50 }, { x: 100, y: 100 }],
});
