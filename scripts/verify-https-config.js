#!/usr/bin/env node

/**
 * HTTPS Configuration Verification Script
 * Verifies all HTTPS configuration files are complete and properly configured
 */

const fs = require('fs');
const path = require('path');

// Configuration files to check
const configFiles = [
  'vercel.json',
  'next.config.ts',
  '.env.example'
];

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VAPI_PUBLIC_API_KEY',
  'VAPI_WEBHOOK_SECRET',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Required security headers
const requiredSecurityHeaders = [
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'X-XSS-Protection',
  'Content-Security-Policy'
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  addTest(`File exists: ${filePath}`, exists, exists ? 'File found' : 'File not found');
  return exists;
}

function checkEnvironmentVariables(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!content.includes(envVar)) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length === 0) {
    addTest(`Environment variables in ${filePath}`, true, 'All required variables present');
  } else {
    addTest(`Environment variables in ${filePath}`, false, `Missing: ${missingVars.join(', ')}`);
  }
}

function checkSecurityHeaders(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingHeaders = [];
  
  for (const header of requiredSecurityHeaders) {
    if (!content.includes(header)) {
      missingHeaders.push(header);
    }
  }
  
  if (missingHeaders.length === 0) {
    addTest(`Security headers in ${filePath}`, true, 'All required headers present');
  } else {
    addTest(`Security headers in ${filePath}`, false, `Missing: ${missingHeaders.join(', ')}`);
  }
}

function checkGoogleAPIKeys(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const googleKeys = [
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
  ];
  
  const foundKeys = googleKeys.filter(key => content.includes(key));
  
  if (foundKeys.length === googleKeys.length) {
    addTest(`Google API keys in ${filePath}`, true, 'All Google API keys present');
  } else {
    const missing = googleKeys.filter(key => !foundKeys.includes(key));
    addTest(`Google API keys in ${filePath}`, false, `Missing: ${missing.join(', ')}`);
  }
}

function checkSSLConfiguration(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const sslConfigs = [
    'ssl_certificate',
    'ssl_certificate_key',
    'ssl_protocols',
    'ssl_ciphers',
    'ssl_session_cache'
  ];
  
  const foundConfigs = sslConfigs.filter(config => content.includes(config));
  
  if (foundConfigs.length === sslConfigs.length) {
    addTest(`SSL configuration in ${filePath}`, true, 'All SSL configurations present');
  } else {
    const missing = sslConfigs.filter(config => !foundConfigs.includes(config));
    addTest(`SSL configuration in ${filePath}`, false, `Missing: ${missing.join(', ')}`);
  }
}

function checkPWASupport(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const pwaConfigs = [
    'manifest.json',
    'service-worker.js',
    'Cache-Control',
    'Content-Type.*manifest'
  ];
  
  const foundConfigs = pwaConfigs.filter(config => content.includes(config));
  
  if (foundConfigs.length >= 3) {
    addTest(`PWA support in ${filePath}`, true, 'PWA configurations present');
  } else {
    addTest(`PWA support in ${filePath}`, false, 'Missing PWA configurations');
  }
}

function checkRateLimiting(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const rateLimitConfigs = [
    'limit_req',
    'rate.*limit',
    'burst'
  ];
  
  const foundConfigs = rateLimitConfigs.filter(config => content.includes(config));
  
  if (foundConfigs.length > 0) {
    addTest(`Rate limiting in ${filePath}`, true, 'Rate limiting configured');
  } else {
    addTest(`Rate limiting in ${filePath}`, false, 'Rate limiting not configured');
  }
}

// Main verification function
async function verifyHTTPSConfiguration() {
  console.log('Verifying HTTPS configuration for CRAVAB...\n');
  
  // Check all configuration files exist
  for (const file of configFiles) {
    checkFileExists(file);
  }
  
  // Check environment variables in relevant files
  checkEnvironmentVariables('.env.example');
  checkEnvironmentVariables('docker/docker-compose.yml');
  checkEnvironmentVariables('vercel.json');
  
  // Check Google API keys specifically
  checkGoogleAPIKeys('.env.example');
  checkGoogleAPIKeys('docker/docker-compose.yml');
  checkGoogleAPIKeys('vercel.json');
  
  // Check security headers
  checkSecurityHeaders('next.config.ts');
  checkSecurityHeaders('docker/nginx.conf');
  checkSecurityHeaders('vercel.json');
  
  // Check SSL configuration
  checkSSLConfiguration('docker/nginx.conf');
  
  // Check PWA support
  checkPWASupport('docker/nginx.conf');
  checkPWASupport('vercel.json');
  
  // Check rate limiting
  checkRateLimiting('docker/nginx.conf');
  
  // Print results
  console.log('\n📊 Verification Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix any failed tests above');
  console.log('2. Set up SSL certificates for production');
  console.log('3. Configure environment variables');
  console.log('4. Test HTTPS deployment');
  console.log('5. Verify PWA functionality');
  
  // Exit with error code if tests failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run verification
verifyHTTPSConfiguration().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
