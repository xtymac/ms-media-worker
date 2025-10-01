const express = require('express');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis client (placeholder - configure with environment variables in production)
const redis = new Redis({
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
  console.log('ms-media-worker running...');
  console.log(`Health check available at http://localhost:${PORT}/health`);

  // Start listening for Redis jobs (placeholder implementation)
  startJobProcessor();
});

// Placeholder function to simulate processing Redis jobs
async function startJobProcessor() {
  console.log('Listening for video compression jobs from Redis...');

  // Simulate job processing (replace with actual BullMQ or Redis queue implementation)
  const QUEUE_NAME = 'video-compression-queue';

  // Example: Listen for jobs using Redis BLPOP (blocking list pop)
  // In production, use a proper queue library like BullMQ
  async function processNextJob() {
    try {
      const result = await redis.blpop(QUEUE_NAME, 5); // 5 second timeout

      if (result) {
        const [queueName, jobData] = result;
        const job = JSON.parse(jobData);

        console.log(`Compressing video ${job.fileId}`);

        // Placeholder: Add actual video compression logic here
        // await compressVideo(job.fileId);

        console.log(`Completed compression for video ${job.fileId}`);
      }
    } catch (error) {
      console.error('Error processing job:', error.message);
    }

    // Continue processing next job
    setImmediate(processNextJob);
  }

  // Start the job processing loop
  processNextJob();
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
