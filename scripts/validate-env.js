#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables are present and properly configured
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
// In development, support both .env.local (recommended) and .env (legacy).
// In production: use process.env (platform-managed secrets).
if (process.env.NODE_ENV !== 'production') {
  const workspaceRoot = path.join(__dirname, '..');
  const envLocalPath = path.join(workspaceRoot, '.env.local');
  const envPath = path.join(workspaceRoot, '.env');

  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath, override: false });
  }

  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: false });
  }
}

// Required environment variables
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MASTER_ENCRYPTION_KEY',
];

// Optional but recommended environment variables
const RECOMMENDED_VARS = [
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_RESEND_API_KEY',
  'EMAIL_FROM',
  'VAPI_API_KEY',
  'VAPI_ASSISTANT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];

// Validation functions
function validateUrl(url, name) {
  try {
    new URL(url);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: `Invalid URL format for ${name}` };
  }
}

function validateKey(key, name, minLength = 1) {
  if (!key || key.length < minLength) {
    return { valid: false, error: `${name} must be at least ${minLength} characters long` };
  }
  return { valid: true, error: null };
}

function validateEmail(email, name) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: `Invalid email format for ${name}` };
  }
  return { valid: true, error: null };
}

// Main validation function
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`❌ ${varName}: Missing`);
    } else {
      // Additional validation for specific variables
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        const urlValidation = validateUrl(value, varName);
        if (!urlValidation.valid) {
          errors.push(`❌ ${varName}: ${urlValidation.error}`);
        }
      }
      
      if (varName === 'MASTER_ENCRYPTION_KEY') {
        const keyValidation = validateKey(value, varName, 32);
        if (!keyValidation.valid) {
          errors.push(`❌ ${varName}: ${keyValidation.error}`);
        }
      }
    }
  });
  
  RECOMMENDED_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`⚠️  ${varName}: Not configured (optional)`);
    } else {
      // Additional validation for specific variables
      if (varName === 'EMAIL_FROM') {
        const emailValidation = validateEmail(value, varName);
        if (!emailValidation.valid) {
          errors.push(`❌ ${varName}: ${emailValidation.error}`);
        }
      }
    }
  });
  
  // Check for common issues
  // Check if running in production without proper URL
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL === 'http://localhost:3000') {
    warnings.push('⚠️  NODE_ENV is production but NEXT_PUBLIC_APP_URL is still localhost');
  }
  
  // Check for development URLs in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('❌ NEXT_PUBLIC_SUPABASE_URL contains localhost in production');
    }
  }
  
  // Check for weak encryption key
  if (process.env.MASTER_ENCRYPTION_KEY && process.env.MASTER_ENCRYPTION_KEY.length < 32) {
    errors.push('❌ MASTER_ENCRYPTION_KEY is too short (minimum 32 characters)');
  }
  
  // Only display results if there are errors or warnings
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Please fix the errors below before running the application.\n');
    errors.forEach(error => console.log(`  ${error}`));
    process.exit(1);
  } else {
    // Silent success - no output for warnings or success
    process.exit(0);
  }
}

// Run validation
validateEnvironment();
