#!/usr/bin/env node

/**
 * PWA Testing Script for Cravab
 * Tests PWA functionality including installation, offline mode, and service worker
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.TEST_URL || 'https://localhost:3000',
  timeout: 10000,
  testIcons: [
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 128, name: 'icon-128.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 152, name: 'icon-152.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 384, name: 'icon-384.png' },
    { size: 512, name: 'icon-512.png' }
  ]
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: config.timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

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

// Test functions
async function testManifest() {
  try {
    const response = await makeRequest(`${config.baseUrl}/manifest.json`);
    
    if (response.status !== 200) {
      addTest('Manifest Accessibility', false, `HTTP ${response.status}`);
      return false;
    }
    
    const manifest = JSON.parse(response.data);
    
    // Check required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      addTest('Manifest Required Fields', false, `Missing: ${missingFields.join(', ')}`);
    } else {
      addTest('Manifest Required Fields', true, 'All required fields present');
    }
    
    // Check icons
    if (!manifest.icons || manifest.icons.length === 0) {
      addTest('Manifest Icons', false, 'No icons defined');
    } else {
      addTest('Manifest Icons', true, `${manifest.icons.length} icons defined`);
    }
    
    // Check display mode
    if (manifest.display !== 'standalone') {
      addTest('Manifest Display Mode', false, `Expected 'standalone', got '${manifest.display}'`);
    } else {
      addTest('Manifest Display Mode', true, 'Display mode is standalone');
    }
    
    return true;
  } catch (error) {
    addTest('Manifest Accessibility', false, error.message);
    return false;
  }
}

async function testServiceWorker() {
  try {
    const response = await makeRequest(`${config.baseUrl}/service-worker.js`);
    
    if (response.status !== 200) {
      addTest('Service Worker Accessibility', false, `HTTP ${response.status}`);
      return false;
    }
    
    addTest('Service Worker Accessibility', true, 'Service worker is accessible');
    
    // Check if it's a valid service worker
    if (response.data.includes('self.addEventListener')) {
      addTest('Service Worker Content', true, 'Contains service worker code');
    } else {
      addTest('Service Worker Content', false, 'Does not contain service worker code');
    }
    
    return true;
  } catch (error) {
    addTest('Service Worker Accessibility', false, error.message);
    return false;
  }
}

async function testIcons() {
  let allIconsExist = true;
  
  for (const icon of config.testIcons) {
    try {
      const response = await makeRequest(`${config.baseUrl}/${icon.name}`);
      
      if (response.status !== 200) {
        addTest(`Icon ${icon.name}`, false, `HTTP ${response.status}`);
        allIconsExist = false;
      } else {
        addTest(`Icon ${icon.name}`, true, 'Icon accessible');
      }
    } catch (error) {
      addTest(`Icon ${icon.name}`, false, error.message);
      allIconsExist = false;
    }
  }
  
  return allIconsExist;
}

async function testHTTPS() {
  if (!config.baseUrl.startsWith('https')) {
    addTest('HTTPS Required', false, 'PWA requires HTTPS for production');
    return false;
  }
  
  try {
    const response = await makeRequest(config.baseUrl);
    addTest('HTTPS Required', true, 'HTTPS is enabled');
    return true;
  } catch (error) {
    addTest('HTTPS Required', false, error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  try {
    const response = await makeRequest(config.baseUrl);
    const headers = response.headers;
    
    // Check for security headers
    const securityHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ];
    
    const missingHeaders = securityHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
      addTest('Security Headers', false, `Missing: ${missingHeaders.join(', ')}`);
    } else {
      addTest('Security Headers', true, 'All security headers present');
    }
    
    return missingHeaders.length === 0;
  } catch (error) {
    addTest('Security Headers', false, error.message);
    return false;
  }
}

async function testPWAFeatures() {
  try {
    const response = await makeRequest(config.baseUrl);
    const html = response.data;
    
    // Check for PWA meta tags
    const pwaMetaTags = [
      'apple-mobile-web-app-capable',
      'apple-mobile-web-app-status-bar-style',
      'theme-color'
    ];
    
    const foundTags = pwaMetaTags.filter(tag => html.includes(tag));
    
    if (foundTags.length === pwaMetaTags.length) {
      addTest('PWA Meta Tags', true, 'All PWA meta tags present');
    } else {
      addTest('PWA Meta Tags', false, `Missing: ${pwaMetaTags.filter(tag => !foundTags.includes(tag)).join(', ')}`);
    }
    
    return foundTags.length === pwaMetaTags.length;
  } catch (error) {
    addTest('PWA Meta Tags', false, error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting PWA Tests for Cravab...\n');
  console.log(`Testing URL: ${config.baseUrl}\n`);
  
  // Run all tests
  await testHTTPS();
  await testManifest();
  await testServiceWorker();
  await testIcons();
  await testSecurityHeaders();
  await testPWAFeatures();
  
  // Print results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  console.log('\n📱 Next Steps:');
  console.log('1. Test PWA installation on real mobile devices');
  console.log('2. Test offline functionality');
  console.log('3. Test service worker updates');
  console.log('4. Verify all features work in installed PWA');
  
  // Exit with error code if tests failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
