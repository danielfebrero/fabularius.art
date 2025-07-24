#!/usr/bin/env node

/**
 * Script to revalidate a specific album for all locales
 * Usage: node scripts/revalidate-album.js <albumId>
 * 
 * Example:
 * node scripts/revalidate-album.js abc123
 * 
 * You can also call the API directly:
 * curl -X POST "https://yoursite.com/api/revalidate?secret=YOUR_SECRET&type=album&albumId=abc123"
 */

const https = require('https');
const http = require('http');

async function revalidateAlbum(albumId) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const SECRET = process.env.REVALIDATE_SECRET;

  if (!SECRET) {
    console.error('❌ REVALIDATE_SECRET environment variable is required');
    process.exit(1);
  }

  if (!albumId) {
    console.error('❌ Album ID is required');
    console.log('Usage: node scripts/revalidate-album.js <albumId>');
    process.exit(1);
  }

  const url = new URL('/api/revalidate', SITE_URL);
  url.searchParams.set('secret', SECRET);
  url.searchParams.set('type', 'album');
  url.searchParams.set('albumId', albumId);

  console.log(`🔄 Revalidating album ${albumId} for all locales...`);
  console.log('📍 URL:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Album revalidated successfully!');
      console.log('📊 Result:', data);
      console.log('🌍 Locales updated:', data.locales?.join(', '));
      console.log('📁 Album ID:', data.albumId);
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

const albumId = process.argv[2];
revalidateAlbum(albumId);
