# Production Setup & Deployment Guide

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- MongoDB 8.2+ (or use Docker version)

### Deploy to Production

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Manual Production Deployment

### Backend Setup

```bash
# Install dependencies
cd backend
npm install --production

# Install additional production packages
npm install express-rate-limit helmet joi

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3011
MONGODB_URI=mongodb://shop_user:shop_password123%21@localhost:27017/shopping_assistant
JWT_SECRET=your-secure-secret-key-change-this
JWT_EXPIRY=7d
FRONTEND_URL=https://yourdomain.com
EOF

# Run database migrations
node scripts/seedDatabase.js

# Start server
npm start
```

### Frontend Setup

```bash
cd frontend
npm install --production

# Build for production
npm run build

# Serve with production server (e.g., nginx)
# Configure nginx to serve dist/ folder
```

## Environment Configuration

### Production .env Variables

```env
# Node Environment
NODE_ENV=production

# Server Port
PORT=3011

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shopping_assistant

# Authentication
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRY=7d

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=5    # per window
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (allow only 80, 443, 3011)
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting (already configured)
- [ ] Use helmet.js for security headers (already configured)
- [ ] Validate all input with Joi (already configured)
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for sensitive data
- [ ] Enable CORS only for your domain
- [ ] Regular security updates for dependencies
- [ ] Monitor error logs for suspicious activity

## Performance Optimization

### MongoDB Indexes
```javascript
// Already configured in Product model:
// - Full-text search index on name, description, tags
// - Price index for sorting
// - Category + Price composite index
```

### Caching Strategy
Add Redis for session and cart caching:

```bash
npm install redis
```

### Image Optimization
- Use CDN for product images
- Compress images before upload
- Use WebP format for better compression
- Lazy load images in product lists

### Database Query Optimization
- Use lean() for read-only queries
- Implement pagination for large datasets
- Add indexes for frequently filtered fields
- Use aggregation pipelines for complex queries

## Monitoring & Logging

### Winston Logger Configuration
Logs are written to:
- `logs/error.log` - Error-level logs
- `logs/combined.log` - All logs
- Console - Development output

### Health Check Endpoint
```bash
curl http://localhost:3011/health
```

## Scaling Considerations

### Horizontal Scaling
1. Use load balancer (nginx, HAProxy) in front of multiple Node instances
2. Use Session store (Redis) shared across instances
3. Configure sticky sessions for Socket.io

### Database Scaling
1. Use MongoDB replica set for high availability
2. Enable automatic backups
3. Monitor disk space and indexes

## Deployment Platforms

### Render.com
See `render.yaml` for deployment config

### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
```

### AWS EC2
```bash
# Install Node.js and MongoDB
# Upload code and environment files
# Install dependencies: npm install --production
# Start with: npm start (or use PM2)
```

### DigitalOcean
Similar to AWS EC2 - use App Platform for easy deployment

## SSL/HTTPS Setup

### Using Let's Encrypt with nginx
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
# Configure nginx to use certificates
```

### In Node (Express)
```javascript
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

https.createServer(options, app).listen(443);
```

## Database Backup Strategy

### Automated MongoDB Backups
```bash
# Daily backup script
mongodump --uri="mongodb://shop_user:password@localhost:27017/shopping_assistant" \
  --out=/backups/$(date +%Y%m%d)
```

### Cloud Backup
- Use MongoDB Atlas for automatic cloud backups
- Or configure S3 bucket for backup storage

## Troubleshooting

### High Memory Usage
```bash
# Monitor with
node --max-old-space-size=2048 backend/server.js

# Or use PM2
pm2 start backend/server.js --max-memory-restart 512M
```

### Database Connection Issues
- Check MongoDB is running
- Verify credentials in MONGODB_URI
- Check firewall rules
- Monitor connection pool size

### Rate Limiting Issues
- Adjust rate limits in `backend/middleware/rateLimiter.js`
- Consider using Redis for distributed rate limiting
- Whitelist internal IPs if needed

## Monitoring Commands

```bash
# Check server status
curl http://localhost:3011/api/health

# Monitor logs
tail -f logs/combined.log

# Check database connection
mongosh "mongodb://user:pass@localhost:27017/shopping_assistant"

# Monitor Node process
ps aux | grep node

# Using PM2 (if installed)
pm2 monit
```

## CI/CD Pipeline Example

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy
        run: npm run deploy
```

## Post-Deployment Checklist

- [ ] Verify all services running
- [ ] Test user registration/login
- [ ] Test product search
- [ ] Test cart functionality
- [ ] Test order creation
- [ ] Monitor error logs
- [ ] Check response times
- [ ] Verify SSL certificate
- [ ] Test from multiple locations
- [ ] Set up monitoring alerts
- [ ] Document server credentials
- [ ] Plan backup schedule
