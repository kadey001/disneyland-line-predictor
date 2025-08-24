/**
 * Environment configuration with Zod validation
 * Type-safe, validates early with comprehensive error reporting
 */

import { z } from 'zod';

// Simple error class for environment issues
export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
    }
}

// Zod schema for environment variables
const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Required variables
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    WAIT_TIMES_API_URL: z.string().url('WAIT_TIMES_API_URL must be a valid URL'),
    QUEUE_TIMES_API_URL: z.string().url('QUEUE_TIMES_API_URL must be a valid URL'),

    // Optional variables
    NEXTAUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    // Production-specific validations
    if (data.NODE_ENV === 'production') {
        if (!data.NEXTAUTH_SECRET) {
            ctx.addIssue({
                code: "custom",
                message: 'NEXTAUTH_SECRET is required in production',
                path: ['NEXTAUTH_SECRET']
            });
        }

        if (!data.DATABASE_URL.startsWith('postgres') && !data.DATABASE_URL.includes('prisma')) {
            ctx.addIssue({
                code: "custom",
                message: 'DATABASE_URL must be a PostgreSQL connection string or prisma one in production',
                path: ['DATABASE_URL']
            });
        }
    }
});

// Parse and validate environment variables
const envData = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL || '',
    WAIT_TIMES_API_URL: process.env.WAIT_TIMES_API_URL || 'https://wait-times-service-602235714983.us-west2.run.app',
    QUEUE_TIMES_API_URL: process.env.QUEUE_TIMES_API_URL || 'https://queue-times.com/parks/16/queue_times.json',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

// Validate environment
let validatedEnv: z.infer<typeof environmentSchema>;

try {
    validatedEnv = environmentSchema.parse(envData);

    if (validatedEnv.NODE_ENV === 'development') {
        console.log('✅ Environment variables validated successfully with Zod');
    }
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Environment validation failed:');
        error.issues.forEach((issue) => {
            console.error(`  ${issue.path.join('.')}: ${issue.message}`);
        });

        if (envData.NODE_ENV === 'production') {
            throw new ConfigError(`Environment validation failed: ${error.issues.map(e => e.message).join(', ')}`);
        } else {
            console.warn('⚠️ Continuing with invalid environment in development mode');
            // Use the original envData with defaults as fallback in development
            validatedEnv = {
                NODE_ENV: (envData.NODE_ENV as 'development' | 'production' | 'test') || 'development',
                DATABASE_URL: envData.DATABASE_URL,
                WAIT_TIMES_API_URL: envData.WAIT_TIMES_API_URL,
                QUEUE_TIMES_API_URL: envData.QUEUE_TIMES_API_URL,
                NEXTAUTH_SECRET: envData.NEXTAUTH_SECRET,
                NEXTAUTH_URL: envData.NEXTAUTH_URL,
            };
        }
    } else {
        throw error;
    }
}

// Type-safe environment object with computed properties
export const config = {
    ...validatedEnv,

    // Computed properties for convenience
    get isProduction() { return this.NODE_ENV === 'production'; },
    get isDevelopment() { return this.NODE_ENV === 'development'; },
    get isTest() { return this.NODE_ENV === 'test'; },
} as const;

// Type export for external use
export type EnvironmentConfig = typeof config;
