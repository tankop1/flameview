# FlameView Backend API

This is the backend API for FlameView's dynamic dashboard system. It provides secure access to Firebase Admin SDK functionality for discovering collections, analyzing schemas, and fetching data from user's Firebase projects.

## Features

- **Firebase Admin SDK Integration**: Secure access to user's Firebase projects using service accounts
- **Collection Discovery**: Automatically discover all Firestore collections and analyze their schemas
- **Data Fetching**: Fetch data from specific collections with filters and pagination
- **Authentication**: Firebase Auth ID token verification for secure API access
- **Real-time Data**: Support for refreshing dashboard data without regenerating code

## Setup

### Prerequisites

- Node.js 16+
- Firebase project with Admin SDK enabled
- Service account key for your FlameView project

### Installation

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:

   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   FIREBASE_PROJECT_ID=your-flameview-project-id
   ```

5. Set up Firebase Admin SDK:
   - Download your FlameView project's service account key
   - Place it in the backend directory as `serviceAccountKey.json`
   - Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Running the Server

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check

- `GET /health` - Server health status
- `GET /api/data/health` - Data routes health (requires auth)

### Data Operations (All require authentication)

#### Discover Schema

- `POST /api/data/discover-schema`
- **Body**: `{ "projectId": "user-project-id" }`
- **Response**: Complete Firestore schema with collections, fields, and relationships

#### Fetch Collections

- `POST /api/data/fetch-collections`
- **Body**:
  ```json
  {
    "projectId": "user-project-id",
    "collections": ["users", "projects"],
    "filters": {
      "users": { "active": true },
      "projects": { "status": "active" }
    },
    "limit": 1000
  }
  ```
- **Response**: Fetched data organized by collection

#### Refresh Data

- `POST /api/data/refresh`
- **Body**:
  ```json
  {
    "projectId": "user-project-id",
    "dataRequirements": {
      "collections": ["users", "projects"],
      "filters": {...},
      "limit": 1000
    }
  }
  ```
- **Response**: Refreshed data using stored requirements

## Authentication

All data endpoints require Firebase Auth ID tokens. Include the token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

The backend will:

1. Verify the token with Firebase Auth
2. Extract user information
3. Retrieve the user's service account for the specified project
4. Initialize Firebase Admin SDK with the service account

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common error types:

- `Unauthorized` - Invalid or missing auth token
- `Bad Request` - Missing required parameters
- `Not Found` - Service account not found for project
- `Internal Server Error` - Server-side errors

## Security

- All endpoints require authentication
- Service accounts are stored securely in Firestore
- No direct access to user's Firebase projects from frontend
- CORS configured for specific frontend URL
- Request size limits to prevent abuse

## Development

### Project Structure

```
backend/
├── middleware/
│   └── authMiddleware.js      # Firebase Auth verification
├── routes/
│   └── dataRoutes.js          # API endpoints
├── services/
│   └── firebaseAdminService.js # Firebase Admin SDK operations
├── server.js                  # Express server setup
├── package.json
└── README.md
```

### Adding New Endpoints

1. Create route handler in `routes/dataRoutes.js`
2. Add authentication middleware: `router.use(verifyAuthToken)`
3. Use Firebase Admin service for data operations
4. Return consistent response format

### Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:5000/health

# Discover schema (requires auth token)
curl -X POST http://localhost:5000/api/data/discover-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"projectId": "your-project-id"}'
```

## Deployment

### Render.com

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `PORT` (Render will set this automatically)
   - `FRONTEND_URL` (your frontend URL)
   - `FIREBASE_PROJECT_ID` (your FlameView project ID)
3. Add build command: `npm install`
4. Add start command: `npm start`

### Environment Variables for Production

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-domain.com
FIREBASE_PROJECT_ID=your-flameview-project-id
```

## Troubleshooting

### Common Issues

1. **"Service account not found"**

   - Ensure user has uploaded service account for the project
   - Check projectId matches exactly

2. **"Authentication failed"**

   - Verify Firebase Auth token is valid
   - Check token hasn't expired

3. **"Collection discovery failed"**

   - Ensure service account has Firestore read permissions
   - Check project has Firestore enabled

4. **CORS errors**
   - Verify FRONTEND_URL matches your frontend domain
   - Check for trailing slashes in URLs

### Logs

The server logs all operations with emojis for easy identification:

- 🔍 Schema discovery
- 📊 Collection analysis
- 📥 Data fetching
- ✅ Success operations
- ❌ Error operations

Check server logs for detailed error information.

## Support

For issues or questions:

1. Check server logs for error details
2. Verify environment variables are set correctly
3. Test with curl/Postman to isolate frontend issues
4. Ensure Firebase project permissions are correct
