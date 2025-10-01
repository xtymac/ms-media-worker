# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ms-media-worker` is a background worker service that subscribes to Redis pub/sub channels for video compression jobs. It runs on Railway using Docker and provides health monitoring capabilities.

## Architecture

- **Express HTTP Server**: Provides `/health` endpoint for monitoring
- **Redis Pub/Sub**: Subscribes to `media:compress` channel using ioredis
- **Message Processing**: Listens for video compression messages and logs processing (placeholder implementation)
- **Graceful Shutdown**: Handles SIGTERM/SIGINT for clean Redis disconnection

### File Structure

```
src/
  index.js          - Main worker entry point with Express server and Redis pub/sub subscriber
Dockerfile          - Node.js 18 container configuration for Railway
package.json        - Dependencies: express, ioredis
```

### Message Format

Messages are JSON strings published to the `media:compress` Redis channel:
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

**Publish test message (via redis-cli):**
```bash
redis-cli PUBLISH media:compress '{"fileId":"test-video"}'
```

## Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `REDIS_HOST` - Redis hostname (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis authentication (optional)

## Implementation Notes

- Uses Redis pub/sub for real-time message delivery
- Video compression logic is placeholder - integrate FFmpeg or cloud transcoding service
- For persistent job tracking with retries, consider migrating to BullMQ with Redis streams
- Health check endpoint should be extended to verify Redis connectivity
