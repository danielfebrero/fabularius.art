#!/usr/bin/env node

/**
 * Script to revalidate static pages (generate, pricing) for all locales
 * Usage: node scripts/revalidate-static-pages.js
 * 
 * You can also call the API directly:
 * curl -X POST "https://yoursite.com/api/revalidate?secret=YOUR_SECRET&type=static-pages"
 */

const https = require('https');
const http = require('http');

async function revalidateStaticPages() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const SECRET = process.env.REVALIDATE_SECRET;

  if (!SECRET) {
    console.error('❌ REVALIDATE_SECRET environment variable is required');
    process.exit(1);
  }

  const url = new URL('/api/revalidate', SITE_URL);
  url.searchParams.set('secret', SECRET);
  url.searchParams.set('type', 'static-pages');

  console.log('🔄 Revalidating static pages (generate, pricing) for all locales...');
  console.log('📍 URL:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Static pages revalidated successfully!');
      console.log('📊 Result:', data);
      console.log('🌍 Locales updated:', data.locales?.join(', '));
      console.log('📄 Pages updated:', data.pages?.join(', '));
    } else {
      console.error('❌ Revalidation failed:', data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during revalidation:', error.message);
    process.exit(1);
  }
}

// Add fetch polyfill for Node.js < 18
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

revalidateStaticPages();
