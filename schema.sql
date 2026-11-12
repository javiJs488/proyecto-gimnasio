-- Esquema de base de datos: Control de Gimnasio
PRAGMA foreign_keys = ON;

-- Tipos de membresía (Mensual, Trimestral, etc.)
CREATE TABLE IF NOT EXISTS membresias (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT    NOT NULL UNIQUE,
  duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
  precio        REAL    NOT NULL CHECK (precio >= 0)
);

-- Socios del gimnasio
CREATE TABLE IF NOT EXISTS socios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT NOT NULL,
  telefono       TEXT,
  email          TEXT UNIQUE,
  fecha_registro TEXT NOT NULL DEFAULT (date('now')),
  membresia_id   INTEGER REFERENCES membresias(id),
  fecha_vencimiento TEXT          -- cuándo vence su membresía actual
);

-- Pagos (cada pago renueva la membresía)
CREATE TABLE IF NOT EXISTS pagos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id     INTEGER NOT NULL REFERENCES socios(id),
  membresia_id INTEGER NOT NULL REFERENCES membresias(id),
  monto        REAL    NOT NULL CHECK (monto >= 0),
  fecha_pago   TEXT    NOT NULL DEFAULT (date('now'))
);

-- Asistencia (check-in)
CREATE TABLE IF NOT EXISTS asistencias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id  INTEGER NOT NULL REFERENCES socios(id),
  fecha_hora TEXT   NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_asistencias_socio ON asistencias(socio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_socio       ON pagos(socio_id);

-- Historial de altas y bajas (sin clave foránea: conserva el nombre aunque se borre el socio)
CREATE TABLE IF NOT EXISTS movimientos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL CHECK (tipo IN ('ALTA', 'BAJA')),
  socio_id   INTEGER,
  nombre     TEXT NOT NULL,
  fecha_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);