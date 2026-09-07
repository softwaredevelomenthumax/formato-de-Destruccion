import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './database/connection.js';
import { initializeDatabase } from './database/schema.js';

// Rutas
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import actasRoutes from './routes/actas.js';
import notificationsRoutes from './routes/notifications.js';
import solicitudesRoutes from './routes/solicitudes.js';
import invimaRoutes from './routes/invima.js';
import cecosRoutes from './routes/cecos.js';
import sapRoutes from './routes/sap.js';

dotenv.config(); // Recargar configuración - debug login

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:5173',
    'http://localhost:8443',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8443',
    'http://10.179.12.212:8443',
    'http://10.179.12.139:8443',
    'http://10.179.12.0:8443',
  ]);

// Middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (origin.startsWith('http://10.179.12.')) {
      callback(null, true);
      return;
    }

    console.warn(`CORS bloqueado para origen: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend está funcionando' });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/invima', invimaRoutes);
app.use('/api/cecos', cecosRoutes);
app.use('/api/sap', sapRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// Iniciar servidor
async function start() {
  try {
    // Conectar a SQL Server
    await connectDatabase();
    
    // Inicializar base de datos
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`✓ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`✓ CORS habilitado para: ${process.env.CORS_ORIGIN}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    // No salir si falla la conexión, arrancar de todas formas
    console.log('\n⚠️  Servidor arrancando sin BD. Verifica tu configuración de SQL Server.\n');
    app.listen(PORT, () => {
      console.log(`✓ Servidor ejecutándose en puerto ${PORT} (sin BD)`);
    });
  }
}

start();
