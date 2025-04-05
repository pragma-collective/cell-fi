import { Hono } from 'hono';
import { isENSNameAvailable, createUserWithENS } from '../util/ensRegistry';
import { z } from 'zod';

export const ensRouter = new Hono();

// Schema for name availability request
const nameAvailabilitySchema = z.object({
  name: z.string().min(1).max(255)
});

// Schema for name registration request
const nameRegistrationSchema = z.object({
  username: z.string().min(1).max(255),
  ensName: z.string().min(1).max(255),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().min(10).max(15)
});

/**
 * Check if an ENS name is available
 * GET /ens/available?name=yourname
 */
ensRouter.get('/available', async (c) => {
  try {
    const name = c.req.query('name');
    
    if (!name) {
      return c.json({ error: 'Name parameter is required' }, 400);
    }
    
    // Validate the request
    const result = nameAvailabilitySchema.safeParse({ name });
    if (!result.success) {
      return c.json({ error: 'Invalid name format', details: result.error.format() }, 400);
    }
    
    const isAvailable = await isENSNameAvailable(name);
    return c.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking ENS name availability:', error);
    return c.json({ error: 'Failed to check name availability' }, 500);
  }
});

/**
 * Register an ENS name for a new user
 * POST /ens/register
 */
ensRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate the request
    const result = nameRegistrationSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: 'Invalid request data', details: result.error.format() }, 400);
    }
    
    const { username, ensName, firstName, lastName, phoneNumber } = result.data;
    
    // First check if the name is available
    const isAvailable = await isENSNameAvailable(ensName);
    if (!isAvailable) {
      return c.json({ error: `ENS name "${ensName}" is already taken` }, 400);
    }
    
    // Create user and register ENS name
    const userData = await createUserWithENS({
      username,
      ensName,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber
    });
    
    return c.json({
      message: 'User created and ENS name registered successfully',
      user: {
        id: userData.user.id,
        username: userData.user.username,
        ensName: userData.user.ensName,
        walletAddress: userData.user.walletAddress
      },
      ensTransaction: userData.ensTransaction
    }, 201);
  } catch (error) {
    console.error('Error registering ENS name:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ error: 'Failed to register ENS name' }, 500);
  }
}); 