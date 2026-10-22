import { getPool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import { sendNotificationEmail } from '../services/emailService.js';
import sql from 'mssql';

// Crear usuario
export async function createUser(req, res) {
  try {
    const { username, password, nombre, email, area, rol } = req.body;
    if (!username?.trim() || !password || !nombre?.trim() || !area?.trim() || !rol) {
      return res.status(400).json({ error: 'Complete los campos obligatorios del usuario' });
    }
    if (rol === 'admin_global' && req.user.rol !== 'admin_global') {
      return res.status(403).json({ error: 'Solo el administrador global puede asignar ese rol' });
    }
    const pool = getPool();

    // Verificar que el usuario no exista
    const existing = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    const id = `u${uuidv4()}`;
    const hashedPassword = await bcryptjs.hash(password, 10);

    await pool.request()
      .input('id', id)
      .input('username', username)
      .input('password', hashedPassword)
      .input('nombre', nombre)
      .input('email', email)
      .input('area', area)
      .input('rol', rol)
      .query(`
        INSERT INTO users (id, username, password, nombre, email, area, rol)
        VALUES (@id, @username, @password, @nombre, @email, @area, @rol)
      `);

    res.status(201).json({ id, username, nombre, email: email || null, area, rol, status: 'activo', createdAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener todos los usuarios
export async function getUsers(req, res) {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT id, username, nombre, email, area, rol, status, createdAt FROM users');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener usuario por ID
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT id, username, nombre, email, area, rol, status, createdAt FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Actualizar usuario
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, nombre, email, area, rol, status, password } = req.body;
    if (Object.prototype.hasOwnProperty.call(req.body, 'username') && !username?.trim()) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }
    if (password && req.user.rol !== 'admin_global') {
      return res.status(403).json({ error: 'Solo el administrador global puede cambiar contraseñas' });
    }
    if (rol === 'admin_global' && req.user.rol !== 'admin_global') {
      return res.status(403).json({ error: 'Solo el administrador global puede asignar ese rol' });
    }
    const pool = getPool();

    const existing = await pool.request().input('id', id).query('SELECT id FROM users WHERE id = @id');
    if (!existing.recordset[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (Object.prototype.hasOwnProperty.call(req.body, 'username')) {
      const usernameExists = await pool.request()
        .input('id', id)
        .input('username', username.trim())
        .query(`SELECT id FROM users
          WHERE id <> @id
            AND LOWER(LTRIM(RTRIM(username))) = LOWER(@username)`);
      if (usernameExists.recordset.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }
    }

    const request = pool.request().input('id', id);
    const queryParts = [];
    const addField = (field, value) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        request.input(field, ['email', 'username'].includes(field) && typeof value === 'string' ? value.trim() || null : value);
        queryParts.push(`${field} = @${field}`);
      }
    };

    addField('username', username);
    addField('nombre', nombre);
    addField('email', email);
    addField('area', area);
    addField('rol', rol);
    addField('status', status);

    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      request.input('password', hashedPassword);
      queryParts.push('password = @password');
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ error: 'No hay cambios para guardar' });
    }
    queryParts.push('updatedAt = GETDATE()');

    await request.query(`
        UPDATE users 
        SET ${queryParts.join(', ')}
        WHERE id = @id
      `);

    const updated = await pool.request()
      .input('id', id)
      .query('SELECT id, username, nombre, email, area, rol, status, createdAt FROM users WHERE id = @id');
    res.json({ message: 'Usuario actualizado', user: updated.recordset[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar usuario
export async function deleteUser(req, res) {
  const transaction = new sql.Transaction(getPool());
  let transactionStarted = false;
  let transactionCompleted = false;

  try {
    const { id } = req.params;
    await transaction.begin();
    transactionStarted = true;

    const user = await new sql.Request(transaction)
      .input('id', id)
      .query('SELECT id FROM users WITH (UPDLOCK, HOLDLOCK) WHERE id = @id');

    if (!user.recordset[0]) {
      await transaction.rollback();
      transactionCompleted = true;
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const actas = await new sql.Request(transaction)
      .input('id', id)
      .query('SELECT id FROM actas WITH (UPDLOCK, HOLDLOCK) WHERE solicitanteId = @id');
    const deletedActaIds = actas.recordset.map((acta) => acta.id);
    const request = () => new sql.Request(transaction).input('id', id);

    await request().query(`
      DELETE FROM notifications
      WHERE userId = @id
        OR actaId IN (SELECT id FROM actas WHERE solicitanteId = @id)
    `);
    await request().query(`
      DELETE FROM acta_historial
      WHERE actaId IN (SELECT id FROM actas WHERE solicitanteId = @id)
    `);
    await request().query(`
      DELETE FROM acta_materiales
      WHERE actaId IN (SELECT id FROM actas WHERE solicitanteId = @id)
    `);
    await request().query(`
      DELETE FROM acta_aprobaciones
      WHERE actaId IN (SELECT id FROM actas WHERE solicitanteId = @id)
    `);
    await request().query('DELETE FROM actas WHERE solicitanteId = @id');
    await request().query('DELETE FROM users WHERE id = @id');

    await transaction.commit();
    transactionCompleted = true;
    res.json({ message: 'Usuario y actas eliminados', deletedActaIds });
  } catch (error) {
    if (transactionStarted && !transactionCompleted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('No se pudo revertir la eliminación del usuario:', rollbackError);
      }
    }
    res.status(500).json({ error: error.message });
  }
}

// Envío manual para comprobar la configuración SMTP con el correo registrado.
export async function sendTestEmail(req, res) {
  try {
    const { id } = req.params;
    console.info(`Iniciando correo de prueba para el usuario ${id}`);
    const result = await getPool().request()
      .input('id', id)
      .query("SELECT id, nombre, email, rol, status FROM users WHERE id = @id");
    const user = result.recordset[0];

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.status !== 'activo') return res.status(400).json({ error: 'El usuario debe estar activo para recibir el correo de prueba' });
    if (!user.email) return res.status(400).json({ error: 'El usuario no tiene un correo registrado' });

    const email = await sendNotificationEmail({
      to: user.email,
      recipientName: user.nombre,
      title: 'Bienvenido a Gestión de Actas',
      message: 'Este es un correo de prueba. Tu dirección corporativa quedó registrada correctamente y recibirás avisos cuando tengas un acta pendiente o una actualización en el flujo.',
    });
    console.info(`Resultado del correo de prueba para ${id}: ${email.sent ? 'enviado' : email.reason}`);

    if (!email.sent) {
      if (email.reason === 'smtp_timeout') {
        return res.status(502).json({
          error: 'No se pudo conectar al servidor SMTP. Verifique que la red o el firewall permitan conexiones salientes a smtp.office365.com por el puerto 587.',
          email,
        });
      }
      return res.status(502).json({ error: 'No se pudo enviar el correo de prueba. Revise la configuración SMTP del backend.', email });
    }

    res.json({ message: 'Correo de prueba enviado', email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
