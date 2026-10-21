require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const { DataTypes } = require('sequelize');
const sequelize = require('./config/db');
const models = require('./models');
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const aiRoutes = require('./routes/aiRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pushRoutes = require('./routes/pushRoutes');
const { createSocketServer } = require('./utils/socket');
const { processMissedEtaTickets } = require('./controllers/ticketController');
const seedDepartmentAdmins = require('./seed-department-admins');
const seedTicketIssues = require('./seed-ticket-issues');
const { apiRequestLimiter } = require('./middleware/rateLimits');
const { assertSecurityConfig, getAllowedOrigins, getTrustProxyHops } = require('./config/security');

assertSecurityConfig();

const app = express();
const { Admin, User } = models;
const PORT = process.env.PORT || 3001;
let databaseReady = false;
const allowedOrigins = new Set(getAllowedOrigins());

app.disable('x-powered-by');
app.set('trust proxy', getTrustProxyHops());
app.use(helmet({
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", "'sha256-XzOGgjZcZ1bP6o7VXBISodPowUTo/FxYmOcduy/b0+g='", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'connect-src': ["'self'", 'https:', 'wss:'],
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    try {
      if (allowedOrigins.has(new URL(origin).origin)) {
        callback(null, true);
        return;
      }
    } catch {
      // Malformed origins are denied below.
    }
    const error = new Error('Origin not allowed by CORS.');
    error.status = 403;
    callback(error);
  },
  credentials: false,
}));
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '5mb' }));
app.use('/api', (req, res, next) => {
  if (!databaseReady) return res.status(503).json({ message: 'Service is temporarily unavailable. Please retry shortly.', request_id: req.requestId });
  return next();
});
app.use('/api', apiRequestLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);

app.get('/health', (req, res) => {
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'starting',
    message: databaseReady ? 'AssistDesk API is running' : 'AssistDesk API is waiting for the database',
  });
});

// Serve React static build if present (for SPA routing, keep API routes under /api)
const path = require('path');
const fs = require('fs');
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
  }));

  // Fallback to index.html for SPA routes (do not override /api or /health)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status >= 500) console.error(JSON.stringify({ event: 'request_error', request_id: req.requestId, method: req.method, path: req.path, status, error_name: err.name || 'Error' }));
  else console.warn(JSON.stringify({ event: 'request_rejected', request_id: req.requestId, method: req.method, path: req.path, status }));
  return res.status(status).json({
    message: status === 413 ? 'Request body is too large.' : 'Request could not be processed.',
    request_id: req.requestId,
  });
});

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

async function normalizeLegacyTicketPriorities() {
  const queryInterface = sequelize.getQueryInterface();
  const ticketsTableExists = await queryInterface.tableExists('tickets');
  if (!ticketsTableExists) return;

  const [results] = await sequelize.query(`
    UPDATE tickets
    SET priority = CASE
      WHEN priority = 'moderate' THEN 'medium'
      WHEN priority = 'high' THEN 'urgent'
      ELSE priority
    END
    WHERE priority IN ('moderate', 'high');
  `);

  if (results && results.affectedRows) {
    console.log(`Normalized legacy ticket priorities: ${results.affectedRows} row(s) updated.`);
  }
}

async function ensureUserProfileColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('users');

  if (!columns.profile_picture) {
    await queryInterface.addColumn('users', 'profile_picture', {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!columns.student_number) {
    await queryInterface.addColumn('users', 'student_number', {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!columns.account_status) {
    await queryInterface.addColumn('users', 'account_status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    });
  }

  if (columns.facial_id) {
    await queryInterface.removeColumn('users', 'facial_id');
  }

  if (!columns.verification_token) {
    await queryInterface.addColumn('users', 'verification_token', {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: null,
    });
  }

  if (sequelize.getDialect() === 'mysql') {
    await sequelize.query('ALTER TABLE users MODIFY COLUMN profile_picture MEDIUMTEXT NULL;');
  }
}

async function ensureUserSessionVersionColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('users');
  if (!columns.session_version) {
    await queryInterface.addColumn('users', 'session_version', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
}

async function ensureChatLogSourceColumns() {
  const queryInterface = sequelize.getQueryInterface();
  if (!(await queryInterface.tableExists('chat_logs'))) return;

  const columns = await queryInterface.describeTable('chat_logs');
  if (!columns.matched_faq_id) {
    await queryInterface.addColumn('chat_logs', 'matched_faq_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
  if (!columns.matched_service_id) {
    await queryInterface.addColumn('chat_logs', 'matched_service_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
}

async function ensureTicketRoutingColumns() {
  const queryInterface = sequelize.getQueryInterface();
  if (await queryInterface.tableExists('tickets')) {
    const columns = await queryInterface.describeTable('tickets');
    const additions = {
      assigned_user_id: { type: DataTypes.INTEGER, allowNull: true },
      assigned_at: { type: DataTypes.DATE, allowNull: true },
      suggested_department_id: { type: DataTypes.INTEGER, allowNull: true },
      routing_method: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'manual' },
      routing_confidence: { type: DataTypes.FLOAT, allowNull: true },
    };
    for (const [column, definition] of Object.entries(additions)) {
      if (!columns[column]) await queryInterface.addColumn('tickets', column, definition);
    }
  }

  if (await queryInterface.tableExists('ticket_updates')) {
    const columns = await queryInterface.describeTable('ticket_updates');
    const additions = {
      action: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'comment' },
      department_id: { type: DataTypes.INTEGER, allowNull: true },
      previous_department_id: { type: DataTypes.INTEGER, allowNull: true },
    };
    for (const [column, definition] of Object.entries(additions)) {
      if (!columns[column]) await queryInterface.addColumn('ticket_updates', column, definition);
    }
  }
}

async function ensureDepartmentMapColumns() {
  const queryInterface = sequelize.getQueryInterface();
  if (!(await queryInterface.tableExists('departments'))) return;
  const columns = await queryInterface.describeTable('departments');
  if (!columns.map_x) {
    await queryInterface.addColumn('departments', 'map_x', { type: DataTypes.FLOAT, allowNull: true });
  }
  if (!columns.map_y) {
    await queryInterface.addColumn('departments', 'map_y', { type: DataTypes.FLOAT, allowNull: true });
  }
}

async function ensureAuditLogTable() {
  await models.AuditLog.sync({ alter: false, force: false });
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('audit_logs');
  if (!columns.department_id) {
    await queryInterface.addColumn('audit_logs', 'department_id', { type: DataTypes.INTEGER, allowNull: true });
  }
}

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
createSocketServer(server);

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return Admin.sync({ alter: false });
  })
  .then(() => {
    console.log('Admins table is ready.');
    return normalizeLegacyTicketPriorities();
  })
  .then(() => {
    return sequelize.sync({ alter: false, force: false });
  })
  .then(() => ensureUserProfileColumns())
  .then(() => ensureUserSessionVersionColumn())
  .then(() => ensureChatLogSourceColumns())
  .then(() => ensureTicketRoutingColumns())
  .then(() => ensureDepartmentMapColumns())
  .then(() => ensureAuditLogTable())
  .then(() => seedTicketIssues({ closeConnection: false }))
  .then(() => {
    return backfillAdminTable();
  })
  .then(() => {
    if (!process.env.SEED_ADMIN_PASSWORD) return null;
    console.log('SEED_ADMIN_PASSWORD detected; seeding department admins...');
    return seedDepartmentAdmins({ closeConnection: false });
  })
  .then(() => {
    databaseReady = true;
    console.log(`Server running on http://localhost:${PORT}`);

    const etaMonitorIntervalMs = Number(process.env.ETA_MONITOR_INTERVAL_MS || 60000);
    let etaMonitorRunning = false;
    const runEtaMonitor = async () => {
      if (etaMonitorRunning) return;
      etaMonitorRunning = true;
      try {
        const escalatedCount = await processMissedEtaTickets();
        if (escalatedCount > 0) {
          console.log(`Escalated ${escalatedCount} overdue ticket(s) to urgent priority.`);
        }
      } catch (error) {
        console.error(JSON.stringify({ event: 'eta_monitor_failed', error_name: error.name || 'Error' }));
      } finally {
        etaMonitorRunning = false;
      }
    };

    runEtaMonitor();
    setInterval(runEtaMonitor, etaMonitorIntervalMs);
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
    console.error('The API will remain available while the database connection is unavailable.');
  });
