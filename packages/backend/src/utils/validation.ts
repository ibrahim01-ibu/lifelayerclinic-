import { z } from 'zod';

export const registerClinicSchema = z.object({
    body: z.object({
        clinicName: z.string().min(1, 'Clinic name is required'),
        licenseNumber: z.string().min(1, 'License number is required'),
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        phone: z.string().min(10, 'Phone number is required'),
        address: z.string().min(1, 'Address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postalCode: z.string().optional(),
        role: z.enum(['admin', 'doctor', 'receptionist']).default('admin'), // Initial user is admin
        fullName: z.string().min(1, 'Full name is required')
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1)
    })
});

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(1),
        role: z.enum(['doctor', 'receptionist', 'manager']),
        phone: z.string().optional(),
        registrationNumber: z.string().optional(), // For doctors
        specializations: z.array(z.string()).optional() // For doctors
    })
});

export const updateClinicSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional()
    })
});
