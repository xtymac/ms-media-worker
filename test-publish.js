#!/usr/bin/env node

/**
 * Test script to publish messages to Redis media:compress channel
 * Usage: node test-publish.js
 */

const Redis = require('ioredis');

// Get Redis URL from environment or use default
const REDIS_URL = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ No REDIS_URL or REDIS_PUBLIC_URL environment variable set');
  console.log('Example: REDIS_URL=redis://user:pass@host:port node test-publish.js');
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
  process.exit(1);
});

async function publishTestJob() {
  try {
    const testJob = {
      jobId: `test_${Date.now()}`,
      videoId: `video_${Date.now()}`,
      originalVideoKey: 'uploads/test-video.mp4',
      originalVideoUrl: 'https://example.com/test-video.mp4',
      outputBucket: 'test-bucket',
      callbackUrl: 'https://example.com/callback',
      metadata: {
        originalFileName: 'test-video.mp4',
        fileSize: 1024000,
        mimeType: 'video/mp4',
        uploadedAt: new Date().toISOString(),
      },
      processingOptions: {
        videoCompression: true,
        audioRepair: true,
        targetBitrate: '2M',
        audioQuality: 'high',
      },
      timestamp: new Date().toISOString(),
    };

    console.log('\n📤 Publishing test job to media:compress channel...');
    console.log('Job payload:', JSON.stringify(testJob, null, 2));

    const subscribers = await redis.publish('media:compress', JSON.stringify(testJob));

    console.log(`\n✅ Job published successfully!`);
    console.log(`📊 Number of subscribers: ${subscribers}`);

    if (subscribers === 0) {
      console.log('⚠️  Warning: No subscribers are listening to this channel');
      console.log('   Make sure ms-media-worker is running and subscribed');
    }

    await redis.quit();
    console.log('\n👋 Disconnected from Redis');
  } catch (error) {
    console.error('❌ Error publishing job:', error);
    await redis.quit();
    process.exit(1);
  }
}

// Run the test
publishTestJob();
