# ms-media-worker

A worker service that listens for video compression jobs from a Redis queue, processes them, and provides health monitoring capabilities.

## Overview

This service is designed to run as a background worker on Railway (or any Docker-compatible platform). It:

- Listens for video compression jobs from a Redis queue
- Processes video files (placeholder for actual compression logic)
- Exposes a `/health` endpoint for health checks and monitoring

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Redis server (local or remote)

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

The worker will start and log:
```
ms-media-worker running...
Health check available at http://localhost:3000/health
```

### Environment Variables

Configure the following environment variables for production:

- `PORT` - HTTP server port (default: 3000)
- `REDIS_HOST` - Redis server hostname (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)

### Health Check

The worker exposes a health check endpoint:

```bash
curl http://localhost:3000/health
# Returns: ok
```

## Docker Deployment

Build the Docker image:

```bash
docker build -t ms-media-worker .
```

Run the container:

```bash
docker run -p 3000:3000 \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PASSWORD=your-redis-password \
  ms-media-worker
```

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
3. Railway will automatically detect the Dockerfile and deploy

## Job Processing

The worker listens for jobs on the `video-compression-queue` Redis list. Jobs should be pushed as JSON strings with the following format:

```json
{
  "fileId": "video-123"
}
```

Example of adding a job to the queue (using Redis CLI):

```bash
redis-cli RPUSH video-compression-queue '{"fileId":"video-123"}'
```

The worker will log:
```
Compressing video video-123
Completed compression for video video-123
```

## Architecture

- **Express** - HTTP server for health checks
- **ioredis** - Redis client for job queue processing
- **BLPOP** - Blocking list operation for efficient job polling (placeholder - consider using BullMQ for production)

## Future Enhancements

- Replace basic Redis BLPOP with a robust queue library (e.g., BullMQ)
- Implement actual video compression logic (e.g., FFmpeg integration)
- Add job retry logic and error handling
- Implement metrics and monitoring (e.g., Prometheus)
- Add unit and integration tests
