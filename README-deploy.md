# Deployment guide for RYDEX

## Recommended production stack
- Frontend + API: Vercel
- Realtime socket server: Render
- Database: MongoDB Atlas

## 1) Prepare services
### Frontend
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Set the environment variables from .env.example.
4. Deploy.

### Socket server
1. Create a new Web Service in Render.
2. Point it to the socketServer folder.
3. Set the build command: npm install
4. Set the start command: node index.js
5. Add environment variables:
   - PORT=10000
   - MONGODB_URL=your_mongodb_atlas_url
   - NEXT_BASE_URL=https://your-vercel-app.vercel.app

## 2) Important environment variables
For the Next.js app, configure these in Vercel:
- MONGODB_URL
- NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-socket-service.onrender.com
- NEXT_PUBLIC_GEOAPIFY_API_KEY
- NEXT_PUBLIC_RAZORPAY_KEY_ID
- AUTH_SECRET
- AUTH_GOOGLE_ID
- AUTH_GOOGLE_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- EMAIL
- PASS
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- GEMINI_API_URL
- NEXT_PUBLIC_ZEGO_APP_ID
- NEXT_PUBLIC_ZEGO_SERVER_SECRET

## 3) Notes
- The current socket server uses a hardcoded localhost CORS allowlist in [socketServer/index.js](socketServer/index.js). For production, you should update it to allow your Vercel domain and Render domain.
- The Next.js app currently expects a MongoDB connection at build/runtime. Make sure MongoDB Atlas is reachable from Vercel and Render.
