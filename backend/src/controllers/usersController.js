import { getPool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';

// Crear usuario
export async function createUser(req, res) {
  try {
    const { username, password, nombre, email, area, rol } = req.body;
    const pool = getPool();

    // Verificar que el usuario no exista
    const existing = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    const id = `u${Date.now()}`;
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

    res.status(201).json({ id, username, nombre, email, area, rol, status: 'activo' });
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
    const { nombre, email, area, rol, status, password } = req.body;
    const pool = getPool();

    const queryParts = [
      'nombre = @nombre',
      'email = @email',
      'area = @area',
      'rol = @rol',
      'status = @status',
      'updatedAt = GETDATE()'
    ];

    const request = pool.request()
      .input('id', id)
      .input('nombre', nombre)
      .input('email', email)
      .input('area', area)
      .input('rol', rol)
      .input('status', status);

    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      request.input('password', hashedPassword);
      queryParts.push('password = @password');
    }

    await request.query(`
        UPDATE users 
        SET ${queryParts.join(', ')}
        WHERE id = @id
      `);

    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Eliminar usuario
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Verificar si tiene actas activas
    const actasActivas = await pool.request()
      .input('solicitanteId', id)
      .query(`
        SELECT COUNT(*) as count FROM actas 
        WHERE solicitanteId = @solicitanteId AND status NOT IN ('cerrada', 'rechazada')
      `);

    if (actasActivas.recordset[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar usuario con actas activas' });
    }

    await pool.request()
      .input('id', id)
      .query('DELETE FROM users WHERE id = @id');

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
