const express = require('express');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis subscriber
// Use REDIS_PUBLIC_URL for external access (Railway proxy), fallback to REDIS_URL (private network)
const REDIS_CONNECTION_URL = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;

if (!REDIS_CONNECTION_URL) {
  console.error('[ERROR] No REDIS_PUBLIC_URL or REDIS_URL configured');
  process.exit(1);
}

console.log('[DEBUG] REDIS_PUBLIC_URL:', process.env.REDIS_PUBLIC_URL ? 'SET' : 'NOT SET');
console.log('[DEBUG] REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
console.log('[DEBUG] Full connection URL:', REDIS_CONNECTION_URL);

let redisConfig;
try {
  const url = new URL(REDIS_CONNECTION_URL);
  redisConfig = `${url.hostname}:${url.port || 6379}`;
  console.log(`[CONFIG] Protocol: ${url.protocol}`);
  console.log(`[CONFIG] Using Redis: ${redisConfig}`);
  console.log(`[CONFIG] Source: ${process.env.REDIS_PUBLIC_URL ? 'REDIS_PUBLIC_URL' : 'REDIS_URL'}`);

  if (!url.protocol.startsWith('redis')) {
    console.error('[ERROR] Invalid protocol - must be redis:// or rediss://, got:', url.protocol);
    process.exit(1);
  }
} catch (error) {
  console.error('[ERROR] Invalid Redis URL:', error.message);
  process.exit(1);
}

const redis = new Redis(REDIS_CONNECTION_URL, {
  retryStrategy: (times) => {
    console.log(`Redis connection retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  }
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.get('/api/health', (req, res) => {
  res.status(200).send('ok');
});

// Test endpoint to trigger a test job (for development/testing)
app.post('/test-job', express.json(), async (req, res) => {
  try {
    const testJob = {
      jobId: `test_${Date.now()}`,
      videoId: req.body.videoId || `video_${Date.now()}`,
      originalVideoKey: req.body.videoKey || 'uploads/test-video.mp4',
      originalVideoUrl: req.body.videoUrl || 'https://example.com/test-video.mp4',
      outputBucket: 'test-bucket',
      callbackUrl: 'https://example.com/callback',
      metadata: {
        originalFileName: req.body.fileName || 'test-video.mp4',
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

    console.log('[TEST] Publishing test job:', testJob);
    const subscribers = await redis.publish('media:compress', JSON.stringify(testJob));

    res.json({
      success: true,
      message: 'Test job published',
      jobId: testJob.jobId,
      subscribers,
    });
  } catch (error) {
    console.error('[TEST] Failed to publish test job:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('=== ms-media-worker STARTUP ===');
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('===============================');

  // Subscribe to Redis channel
  subscribeToChannel();
});

// Subscribe to media:compress channel
async function subscribeToChannel() {
  const CHANNEL = (process.env.QUEUE_CHANNEL || 'media:compress').trim();
  console.log(`[CONFIG] Using QUEUE_CHANNEL: ${CHANNEL}`);

  redis.subscribe(CHANNEL, (err, count) => {
    if (err) {
      console.error('Failed to subscribe to channel:', err.message);
      return;
    }
    console.log(`Subscribed to ${count} channel(s): ${CHANNEL}`);
  });

  redis.on('message', (channel, message) => {
    if (channel === CHANNEL) {
      try {
        const data = JSON.parse(message);
        console.log('[JOB RECEIVED] Processing compression job:', {
          jobId: data.jobId,
          videoId: data.videoId,
          videoKey: data.originalVideoKey,
          compression: data.processingOptions?.videoCompression,
          audioRepair: data.processingOptions?.audioRepair
        });

        // Placeholder: Add actual video compression logic here
        // await compressVideo(data.videoId, data.originalVideoUrl, data.processingOptions);
      } catch (error) {
        console.error('Error processing message:', error.message);
      }
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});
