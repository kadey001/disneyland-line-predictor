#!/usr/bin/env node

/**
 * Environment validation script - Simplified
 * Validates all required environment variables before build/deployment
 * Respects .env files and only uses defaults when vars are missing
 */

// Load .env file using dotenv (like Next.js does)
require('dotenv').config();

const requiredVars = [
    'DATABASE_URL',
    'WAIT_TIMES_API_URL',
    'QUEUE_TIMES_API_URL'
];

const productionVars = [
    'NEXTAUTH_SECRET'
];

const urlVars = [
    'WAIT_TIMES_API_URL',
    'QUEUE_TIMES_API_URL'
];

const SECRET_PLACEHOLDER = '*****'

function validateUrl(url, name) {
    try {
        new URL(url);
        return true;
    } catch {
        console.error(`❌ ${name} must be a valid URL, got: ${url}`);
        return false;
    }
}

function validateEnvironment() {
    console.log('🔍 Validating environment variables...');

    const errors = [];
    const warnings = [];

    // Only use defaults if variables are completely missing
    const defaults = {
        NODE_ENV: 'development',
        WAIT_TIMES_API_URL: 'http://localhost:8080/wait-times',
        QUEUE_TIMES_API_URL: 'https://queue-times.com/parks/16/queue_times.json'
    };

    // Apply defaults only if not in production and variable is missing
    if (process.env.NODE_ENV !== 'production') {
        for (const [key, value] of Object.entries(defaults)) {
            if (!process.env[key]) {
                process.env[key] = value;
                console.log(`ℹ️  Using default value for ${key}: ${value}`);
            }
        }
    }

    console.log('🔧 Current environment variables:');
    requiredVars.concat(['NODE_ENV', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']).forEach(varName => {
        const value = process.env[varName];
        if (value) {
            const displayValue = varName.includes('SECRET') || varName.includes('DATABASE_URL') ? SECRET_PLACEHOLDER : value;
            console.log(`   ${varName}: ${displayValue}`);
        }
    });
    console.log('');

    // Check required variables
    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value) {
            errors.push(`Missing required environment variable: ${varName}`);
        } else {
            const displayValue = varName.includes('DATABASE_URL') ? SECRET_PLACEHOLDER : value;
            console.log(`✅ ${varName}: ${displayValue}`);
        }
    }

    // Check URL format
    for (const varName of urlVars) {
        const value = process.env[varName];
        if (value && !validateUrl(value, varName)) {
            errors.push(`Invalid URL format for ${varName}`);
        }
    }

    // Check production variables
    if (process.env.NODE_ENV === 'production') {
        for (const varName of productionVars) {
            const value = process.env[varName];
            if (!value) {
                errors.push(`Missing production environment variable: ${varName}`);
            } else if (varName === 'NEXTAUTH_SECRET' && value.length < 32) {
                errors.push(`${varName} must be at least 32 characters in production`);
            } else {
                console.log(`✅ ${varName}: ${SECRET_PLACEHOLDER}`);
            }
        }

        if (!process.env.NEXTAUTH_URL) {
            warnings.push('NEXTAUTH_URL not set - will use Cloud Run service URL');
        }

        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('prisma')) {
            warnings.push('DATABASE_URL should be a Prisma connection string in production');
        }
    }

    // Report results
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (errors.length > 0) {
        console.log('\n❌ Environment validation failed:');
        errors.forEach(error => console.log(`   ${error}`));
        console.log('\n💡 Tip: Copy .env.example to .env and fill in the required values');
        process.exit(1);
    }

    console.log('\n✅ Environment validation passed!');
}

validateEnvironment();
