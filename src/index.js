const express = require('express');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis subscriber
// Priority: REDIS_URL → (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
let redisConfig;
if (process.env.REDIS_URL) {
  // Parse URL to log host:port (sanitized)
  const url = new URL(process.env.REDIS_URL);
  redisConfig = `${url.hostname}:${url.port || 6379}`;
  console.log(`[CONFIG] Using REDIS_URL: ${redisConfig}`);
} else {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || 6379;
  redisConfig = `${host}:${port}`;
  console.log(`[CONFIG] Using REDIS_HOST/PORT: ${redisConfig}`);
}

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        console.log(`Redis connection retry attempt ${times}`);
        return Math.min(times * 50, 2000);
      }
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
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

// Start the server
app.listen(PORT, () => {
  console.log('=== ms-media-worker STARTUP ===');
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('[CONFIG] Configuration Summary:');
  console.log(`  - Redis: ${redisConfig}`);
  console.log(`  - REDIS_URL present: ${!!process.env.REDIS_URL}`);
  console.log(`  - REDIS_PUBLIC_URL: ${process.env.REDIS_PUBLIC_URL || '(not set)'}`);
  console.log('===============================');

  // Subscribe to Redis channel
  subscribeToChannel();
});

// Subscribe to media:compress channel
async function subscribeToChannel() {
  const CHANNEL = process.env.QUEUE_CHANNEL || 'media:compress';
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
        console.log(`Compressing video ${data.fileId}...`);

        // Placeholder: Add actual video compression logic here
        // await compressVideo(data.fileId);
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
