import { z } from 'zod';

// User schemas
export const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric'),
  password: z.string().min(6).max(100)
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
});

// Point schema
export const PointSchema = z.object({
  x: z.number().int().min(0).max(600),
  y: z.number().int().min(0).max(400)
});

// Blueprint creation schema
export const CreateBlueprintSchema = z.object({
  author: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Author must be alphanumeric'),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Name must be alphanumeric'),
  points: z.array(PointSchema).optional().default([])
});

// Blueprint update schema
export const UpdateBlueprintSchema = z.object({
  points: z.array(PointSchema).max(1000, 'Maximum 1000 points allowed')
});

// Draw event schema
export const DrawEventSchema = z.object({
  author: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  point: PointSchema,
  room: z.string().optional()
});
