#!/usr/bin/env ts-node

/**
 * Environment validation script with Zod
 * Validates all required environment variables before build/deployment
 * Uses the same Zod schema as the main config for consistency
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file using dotenv (like Next.js does)
dotenv.config();

// Zod schema for environment variables (same as in config.ts)
const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Required variables
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    WAIT_TIMES_API_URL: z.string().url('WAIT_TIMES_API_URL must be a valid URL'),
    QUEUE_TIMES_API_URL: z.string().url('QUEUE_TIMES_API_URL must be a valid URL'),

    // Optional variables
    NEXTAUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    // Production-specific validations
    if (data.NODE_ENV === 'production') {
        if (!data.NEXTAUTH_SECRET) {
            ctx.addIssue({
                code: "custom",
                message: 'NEXTAUTH_SECRET is required in production',
                path: ['NEXTAUTH_SECRET']
            });
        } else if (data.NEXTAUTH_SECRET.length < 32) {
            ctx.addIssue({
                code: "custom",
                message: 'NEXTAUTH_SECRET must be at least 32 characters in production',
                path: ['NEXTAUTH_SECRET']
            });
        }

        if (!data.DATABASE_URL.startsWith('postgres')) {
            ctx.addIssue({
                code: "custom",
                message: 'DATABASE_URL must be a PostgreSQL connection string in production',
                path: ['DATABASE_URL']
            });
        }
    }
});

const SECRET_PLACEHOLDER = '*****';

function validateEnvironment() {
    console.log('🔍 Validating environment variables with Zod...');

    // Prepare environment data with defaults for development
    const envData = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL || '',
        WAIT_TIMES_API_URL: process.env.WAIT_TIMES_API_URL || 'https://wait-times-service-602235714983.us-west2.run.app',
        QUEUE_TIMES_API_URL: process.env.QUEUE_TIMES_API_URL || 'https://queue-times.com/parks/16/queue_times.json',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    };

    // Apply defaults only if not in production and variable is missing
    if (process.env.NODE_ENV !== 'production') {
        if (!process.env.WAIT_TIMES_API_URL) {
            envData.WAIT_TIMES_API_URL = 'http://localhost:8080/wait-times';
            console.log(`ℹ️  Using default value for WAIT_TIMES_API_URL: http://localhost:8080/wait-times`);
        }
        if (!process.env.QUEUE_TIMES_API_URL) {
            envData.QUEUE_TIMES_API_URL = 'https://queue-times.com/parks/16/queue_times.json';
            console.log(`ℹ️  Using default value for QUEUE_TIMES_API_URL: https://queue-times.com/parks/16/queue_times.json`);
        }
    }

    console.log('🔧 Current environment variables:');
    const varsToShow = ['NODE_ENV', 'DATABASE_URL', 'WAIT_TIMES_API_URL', 'QUEUE_TIMES_API_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    varsToShow.forEach(varName => {
        const value = envData[varName as keyof typeof envData];
        if (value) {
            const displayValue = varName.includes('SECRET') || varName.includes('DATABASE_URL') ? SECRET_PLACEHOLDER : value;
            console.log(`   ${varName}: ${displayValue}`);
        }
    });
    console.log('');

    try {
        const validatedEnv = environmentSchema.parse(envData);

        // Report successful validation
        console.log('✅ Required variables validated:');
        console.log(`   DATABASE_URL: ${SECRET_PLACEHOLDER}`);
        console.log(`   WAIT_TIMES_API_URL: ${validatedEnv.WAIT_TIMES_API_URL}`);
        console.log(`   QUEUE_TIMES_API_URL: ${validatedEnv.QUEUE_TIMES_API_URL}`);

        if (validatedEnv.NODE_ENV === 'production') {
            console.log(`   NEXTAUTH_SECRET: ${SECRET_PLACEHOLDER}`);
            if (validatedEnv.NEXTAUTH_URL) {
                console.log(`   NEXTAUTH_URL: ${validatedEnv.NEXTAUTH_URL}`);
            }
        }

        console.log('\n✅ Environment validation passed with Zod!');

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.log('\n❌ Environment validation failed:');
            error.issues.forEach((issue) => {
                console.log(`   ${issue.path.join('.')}: ${issue.message}`);
            });
            console.log('\n💡 Tip: Copy .env.example to .env and fill in the required values');
            process.exit(1);
        } else {
            throw error;
        }
    }
}

validateEnvironment();
