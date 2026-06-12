import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import repairRoutes from './routes/repairs';
import adminRoutes from './routes/admin';
import { authMiddleware, adminMiddleware, AuthRequest } from './middleware/auth';

// Run seed on startup
import './seed';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Public routes
app.use('/api/auth', (req, res, next) => {
  // login and register don't need auth
  if (req.path === '/login' || req.path === '/register') {
    return next();
  }
  // /me needs auth
  return authMiddleware(req as AuthRequest, res, next);
}, authRoutes);

// Protected routes - require auth
app.use('/api/repairs', authMiddleware as express.RequestHandler, repairRoutes);
app.use('/api/admin', authMiddleware as express.RequestHandler, adminMiddleware as express.RequestHandler, adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
