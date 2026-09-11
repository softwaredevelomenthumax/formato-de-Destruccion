import { getPool } from './connection.js';

export async function initializeDatabase() {
  const pool = getPool();

  if (!pool) {
    throw new Error('No hay una conexión activa a SQL Server para inicializar el esquema');
  }

  try {
    // Crear tablas
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        nombre NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        area NVARCHAR(100),
        rol NVARCHAR(50) NOT NULL,
        status NVARCHAR(20) DEFAULT 'activo',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'actas')
      CREATE TABLE actas (
        id NVARCHAR(50) PRIMARY KEY,
        consecutivo NVARCHAR(50) UNIQUE NOT NULL,
        solicitanteId NVARCHAR(50) NOT NULL,
        solicitanteNombre NVARCHAR(255) NOT NULL,
        status NVARCHAR(50) DEFAULT 'borrador',
        clasificacion NVARCHAR(100),
        causal NVARCHAR(100),
        tipoElemento NVARCHAR(100),
        unidadMedida NVARCHAR(50),
        cantidad FLOAT,
        ceco NVARCHAR(50),
        observacionesActa NVARCHAR(MAX),
        requiereCostos BIT DEFAULT 0,
        fechaVencimiento DATE,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (solicitanteId) REFERENCES users(id)
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'acta_historial')
      CREATE TABLE acta_historial (
        id NVARCHAR(50) PRIMARY KEY,
        actaId NVARCHAR(50) NOT NULL,
        usuario NVARCHAR(255),
        fecha DATE,
        hora NVARCHAR(5),
        equipo NVARCHAR(100),
        accion NVARCHAR(MAX),
        FOREIGN KEY (actaId) REFERENCES actas(id)
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'acta_aprobaciones')
      CREATE TABLE acta_aprobaciones (
        id NVARCHAR(50) PRIMARY KEY,
        actaId NVARCHAR(50) NOT NULL,
        paso NVARCHAR(50),
        status NVARCHAR(50),
        aprobador NVARCHAR(255),
        comentario NVARCHAR(MAX),
        motivo NVARCHAR(MAX),
        ajustes NVARCHAR(MAX),
        FOREIGN KEY (actaId) REFERENCES actas(id)
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'notifications')
      CREATE TABLE notifications (
        id NVARCHAR(50) PRIMARY KEY,
        userId NVARCHAR(50) NOT NULL,
        titulo NVARCHAR(255),
        mensaje NVARCHAR(MAX),
        tipo NVARCHAR(50),
        actaId NVARCHAR(50),
        [read] BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'solicitudes')
      CREATE TABLE solicitudes (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(100),
        password NVARCHAR(255),
        nombre NVARCHAR(255),
        email NVARCHAR(255),
        area NVARCHAR(100),
        rolSolicitado NVARCHAR(50),
        status NVARCHAR(50) DEFAULT 'pendiente',
        createdAt DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'invima_products')
      CREATE TABLE invima_products (
        id NVARCHAR(50) PRIMARY KEY,
        productName NVARCHAR(255),
        registryNumber NVARCHAR(100),
        internalStatus NVARCHAR(50),
        holder NVARCHAR(255),
        tipoMedicamento NVARCHAR(255),
        controlado BIT DEFAULT 0,
        presentacion NVARCHAR(255),
        empresaCode NVARCHAR(20),
        empresa NVARCHAR(100),
        requiereSap BIT DEFAULT 1,
        requiereInvima BIT DEFAULT 1,
        createdAt DATETIME DEFAULT GETDATE()
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sap_codes')
      CREATE TABLE sap_codes (
        id NVARCHAR(50) PRIMARY KEY,
        codigo NVARCHAR(100) NOT NULL,
        descripcion NVARCHAR(255),
        empresaCode NVARCHAR(20) NOT NULL,
        empresa NVARCHAR(100) NOT NULL,
        invimaProductId NVARCHAR(50),
        presentacion NVARCHAR(255),
        unidadMedida NVARCHAR(50),
        status NVARCHAR(20) DEFAULT 'Activo',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (invimaProductId) REFERENCES invima_products(id)
      );

      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'cecos')
      CREATE TABLE cecos (
        id NVARCHAR(50) NOT NULL,
        empresaCode NVARCHAR(20) NOT NULL,
        empresa NVARCHAR(100) NOT NULL,
        ceco NVARCHAR(50) NOT NULL,
        denominacion NVARCHAR(255) NOT NULL,
        responsable NVARCHAR(255),
        departamento NVARCHAR(100),
        tipoCosto NVARCHAR(100),
        moneda NVARCHAR(10),
        status NVARCHAR(20) DEFAULT 'Activo',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_cecos PRIMARY KEY (id),
        CONSTRAINT UQ_cecos_empresa_ceco UNIQUE (empresaCode, ceco)
      );
    `);

    // Agregar las columnas del formulario a bases de datos existentes.
    await pool.request().query(`
      IF COL_LENGTH('actas', 'empresa') IS NULL ALTER TABLE actas ADD empresa NVARCHAR(50);
      IF COL_LENGTH('actas', 'centroCostos') IS NULL ALTER TABLE actas ADD centroCostos NVARCHAR(255);
      IF COL_LENGTH('actas', 'fecha') IS NULL ALTER TABLE actas ADD fecha DATE;
      IF COL_LENGTH('actas', 'responsable') IS NULL ALTER TABLE actas ADD responsable NVARCHAR(255);
      IF COL_LENGTH('actas', 'area') IS NULL ALTER TABLE actas ADD area NVARCHAR(100);
      IF COL_LENGTH('actas', 'descripcion') IS NULL ALTER TABLE actas ADD descripcion NVARCHAR(MAX);
      IF COL_LENGTH('actas', 'codigoSAP') IS NULL ALTER TABLE actas ADD codigoSAP NVARCHAR(100);
      IF COL_LENGTH('actas', 'numeroLote') IS NULL ALTER TABLE actas ADD numeroLote NVARCHAR(100);
      IF COL_LENGTH('actas', 'ordenProduccion') IS NULL ALTER TABLE actas ADD ordenProduccion NVARCHAR(100);
      IF COL_LENGTH('actas', 'sustanciaControlada') IS NULL ALTER TABLE actas ADD sustanciaControlada BIT;
      IF COL_LENGTH('actas', 'registroINVIMA') IS NULL ALTER TABLE actas ADD registroINVIMA NVARCHAR(100);
      IF COL_LENGTH('actas', 'estadoInvima') IS NULL ALTER TABLE actas ADD estadoInvima NVARCHAR(50);
      IF COL_LENGTH('notifications', 'actaId') IS NULL ALTER TABLE notifications ADD actaId NVARCHAR(50);
      IF COL_LENGTH('actas', 'pesoKg') IS NULL ALTER TABLE actas ADD pesoKg FLOAT;
      IF COL_LENGTH('actas', 'cantidadUnidades') IS NULL ALTER TABLE actas ADD cantidadUnidades FLOAT;
      IF COL_LENGTH('actas', 'costoDestruccion') IS NULL ALTER TABLE actas ADD costoDestruccion FLOAT;
      IF COL_LENGTH('actas', 'otraCausal') IS NULL ALTER TABLE actas ADD otraCausal NVARCHAR(255);
      IF COL_LENGTH('actas', 'observaciones') IS NULL ALTER TABLE actas ADD observaciones NVARCHAR(MAX);
      IF COL_LENGTH('actas', 'adjuntos') IS NULL ALTER TABLE actas ADD adjuntos NVARCHAR(MAX);
      IF COL_LENGTH('invima_products', 'empresaCode') IS NULL ALTER TABLE invima_products ADD empresaCode NVARCHAR(20);
      IF COL_LENGTH('invima_products', 'empresa') IS NULL ALTER TABLE invima_products ADD empresa NVARCHAR(100);
      IF COL_LENGTH('invima_products', 'requiereSap') IS NULL ALTER TABLE invima_products ADD requiereSap BIT DEFAULT 1;
      IF COL_LENGTH('invima_products', 'requiereInvima') IS NULL ALTER TABLE invima_products ADD requiereInvima BIT DEFAULT 1;
      IF COL_LENGTH('invima_products', 'fabricante') IS NULL ALTER TABLE invima_products ADD fabricante NVARCHAR(255);
      IF COL_LENGTH('invima_products', 'clase') IS NULL ALTER TABLE invima_products ADD clase NVARCHAR(100);
      IF COL_LENGTH('invima_products', 'estatusSap') IS NULL ALTER TABLE invima_products ADD estatusSap NVARCHAR(50) DEFAULT 'Activo';
      IF COL_LENGTH('invima_products', 'codigo') IS NULL ALTER TABLE invima_products ADD codigo NVARCHAR(100);
      IF COL_LENGTH('invima_products', 'canal') IS NULL ALTER TABLE invima_products ADD canal NVARCHAR(100);
      IF COL_LENGTH('invima_products', 'estadoInvima') IS NULL ALTER TABLE invima_products ADD estadoInvima NVARCHAR(50);
      IF COL_LENGTH('invima_products', 'codigoMaterial') IS NULL ALTER TABLE invima_products ADD codigoMaterial NVARCHAR(100);
      IF COL_LENGTH('actas', 'cecoId') IS NULL ALTER TABLE actas ADD cecoId NVARCHAR(50);
      IF COL_LENGTH('actas', 'invimaProductId') IS NULL ALTER TABLE actas ADD invimaProductId NVARCHAR(50);
      IF COL_LENGTH('actas', 'sapCodeId') IS NULL ALTER TABLE actas ADD sapCodeId NVARCHAR(50);

      IF COL_LENGTH('cecos', 'id') IS NULL ALTER TABLE cecos ADD id NVARCHAR(50) NULL;
      IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'cecos')
        AND EXISTS (SELECT 1 FROM cecos WHERE id IS NULL)
        UPDATE cecos SET id = empresaCode + '-' + ceco WHERE id IS NULL;
      IF COL_LENGTH('cecos', 'id') IS NOT NULL
        ALTER TABLE cecos ALTER COLUMN id NVARCHAR(50) NOT NULL;
      IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_cecos' AND parent_object_id = OBJECT_ID('cecos'))
        AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id WHERE i.name = 'PK_cecos' AND c.name <> 'id')
        ALTER TABLE cecos DROP CONSTRAINT PK_cecos;
      IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_cecos' AND parent_object_id = OBJECT_ID('cecos'))
        ALTER TABLE cecos ADD CONSTRAINT PK_cecos PRIMARY KEY (id);
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_cecos_empresa_ceco' AND object_id = OBJECT_ID('cecos'))
        ALTER TABLE cecos ADD CONSTRAINT UQ_cecos_empresa_ceco UNIQUE (empresaCode, ceco);
    `);

    console.log('✓ Tablas creadas exitosamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error.message);
    throw error;
  }
}
