# Guia Único - Health Insurance Simulator
## Deployment Guide for Coolify

### Prerequisites
- Coolify instance running
- PostgreSQL database (or Coolify can provision one)
- Domain name (optional)

### Environment Variables Required

#### Database
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

#### Application
```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET=your-super-secret-session-key-here-minimum-32-characters
```

#### Optional - Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Optional - WhatsApp Integration
```
WHATSAPP_API_URL=https://api.whatsapp.business/v1
WHATSAPP_TOKEN=your-whatsapp-token
```

### Deployment Steps

1. **Fork/Clone Repository**
   - Add your repository to Coolify

2. **Database Setup**
   - Create PostgreSQL database in Coolify
   - Copy the DATABASE_URL from the database settings

3. **Environment Configuration**
   - Add all required environment variables in Coolify
   - Generate a strong SESSION_SECRET (minimum 32 characters)

4. **Deploy Application**
   - Coolify will automatically build using the Dockerfile
   - The application will be available on port 5000

5. **Database Migration**
   - After first deployment, run database migration:
   ```bash
   npm run db:push
   ```

### Features Included

- **Multi-step Health Insurance Form**
  - Dynamic form fields with conditional logic
  - Real-time validation
  - File upload support

- **Plan Recommendation Engine**
  - Personalized recommendations based on user input
  - Price comparison
  - Feature matching

- **Admin Panel**
  - User management
  - Plan configuration
  - Form builder
  - Analytics dashboard

- **WhatsApp Integration**
  - Automated consultant assignment
  - Contact distribution system

- **Export Functionality**
  - Excel export of form submissions
  - Detailed analytics reports

### Health Check
The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Security Features
- bcrypt password hashing
- Session-based authentication
- HTTPS ready (when deployed with SSL)
- SQL injection protection via Drizzle ORM
- Input validation with Zod schemas

### Performance Optimizations
- Static asset caching
- Database connection pooling
- Compressed responses
- Memory-efficient in-memory fallback

### Monitoring
- Application logs via console
- Health check endpoint for uptime monitoring
- Error tracking and reporting

### Troubleshooting

#### Database Connection Issues
- Verify DATABASE_URL format
- Check database server accessibility
- Ensure SSL is properly configured for production

#### Build Failures
- Check Node.js version (requires Node 20+)
- Verify all dependencies are properly installed
- Review build logs for specific errors

#### Runtime Errors
- Check environment variables are set
- Review application logs
- Verify database migrations have run

### Support
For technical support, check the application logs and health endpoint first. The application automatically falls back to in-memory storage if database connection fails.