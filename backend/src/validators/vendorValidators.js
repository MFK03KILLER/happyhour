const { z } = require('zod');

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

// Team members added by a venue owner. Which roles and locations are allowed is
// checked against the owner's own vendor in the controller.
const teamCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password needs at least 8 characters').max(128),
  roleSlug: z.string().min(1, 'Choose a role'),
  merchantId: objectId.optional().or(z.literal('')),
});

const teamUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(8, 'Password needs at least 8 characters').max(128).optional(),
  roleSlug: z.string().min(1).optional(),
  merchantId: objectId.optional().or(z.literal('')).or(z.null()),
  status: z.enum(['active', 'suspended']).optional(),
});

module.exports = { teamCreateSchema, teamUpdateSchema };
