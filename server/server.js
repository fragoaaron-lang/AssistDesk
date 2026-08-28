require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const models = require('./models');
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const aiRoutes = require('./routes/aiRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { createSocketServer } = require('./utils/socket');
const seedDepartmentAdmins = require('./seed-department-admins');

const app = express();
const { Admin, User } = models;
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'https://assist-desk-ebon.vercel.app',
  'http://localhost:3005',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and explicit allowed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // For disallowed origins, do not throw an error (which results in 500).
    // Instead, deny CORS by calling back with null and false so the request
    // proceeds but without CORS headers (the browser will block it).
    console.warn('CORS: blocking origin', origin);
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AssistDesk API is running' });
});

// Serve React static build if present (for SPA routing, keep API routes under /api)
const path = require('path');
const fs = require('fs');
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // Fallback to index.html for SPA routes (do not override /api or /health)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

async function backfillAdminTable() {
  const adminUsers = await User.findAll({ where: { role: 'admin' } });
  for (const user of adminUsers) {
    if (!user.department_id) continue;
    await Admin.findOrCreate({
      where: { email: user.email },
      defaults: {
        user_id: user.id,
        department_id: user.department_id,
        name: user.name,
        email: user.email,
        password_hash: user.password_hash,
      },
    });
  }
}

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return sequelize.sync({ alter: true, force: false });
  })
  .then(() => {
    return backfillAdminTable();
  })
  .then(() => {
    if (!process.env.SEED_ADMIN_PASSWORD) return null;
    console.log('SEED_ADMIN_PASSWORD detected; seeding department admins...');
    return seedDepartmentAdmins({ closeConnection: false });
  })
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    createSocketServer(server);
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  });
