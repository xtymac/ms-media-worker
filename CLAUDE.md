# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ms-media-worker` is a background worker service designed to process video compression jobs from a Redis queue. It runs on Railway using Docker and provides health monitoring capabilities.

## Architecture

- **Express HTTP Server**: Provides `/health` endpoint for monitoring
- **Redis Queue Processing**: Uses ioredis with BLPOP to listen for jobs on `video-compression-queue`
- **Job Processing**: Placeholder implementation for video compression (extend with FFmpeg or similar)
- **Graceful Shutdown**: Handles SIGTERM/SIGINT for clean Redis disconnection

### File Structure

```
src/
  index.js          - Main worker entry point with Express server and Redis job processor
Dockerfile          - Node.js 18 container configuration for Railway
package.json        - Dependencies: express, ioredis
```

### Job Format

Jobs are JSON strings pushed to the `video-compression-queue` Redis list:
```json
{"fileId": "video-123"}
```

## Development Commands

**Start worker:**
```bash
npm start
```

**Run with Docker:**
```bash
docker build -t ms-media-worker .
docker run -p 3000:3000 -e REDIS_HOST=localhost ms-media-worker
```

**Test health endpoint:**
```bash
curl http://localhost:3000/health
```

**Add test job to queue (via redis-cli):**
```bash
redis-cli RPUSH video-compression-queue '{"fileId":"test-video"}'
```

## Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `REDIS_HOST` - Redis hostname (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis authentication (optional)

## Implementation Notes

- Current implementation uses basic Redis BLPOP for job polling
- For production, consider migrating to BullMQ for better queue management, retries, and job status tracking
- Video compression logic is placeholder - integrate FFmpeg or cloud transcoding service
- Health check endpoint should be extended to verify Redis connectivity
