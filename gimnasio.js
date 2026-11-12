// Sistema de control de gimnasio - Node.js + SQLite (módulo integrado node:sqlite)
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

const db = new DatabaseSync(path.join(__dirname, "gimnasio.db"));
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// Migración: agrega la columna "activo" si tu base de datos ya existía sin ella
const cols = db
  .prepare("PRAGMA table_info(socios)")
  .all()
  .map((c) => c.name);
if (!cols.includes("activo")) {
  db.exec("ALTER TABLE socios ADD COLUMN activo INTEGER NOT NULL DEFAULT 1");
}

// Limpieza: quita movimientos de socios que ya fueron eliminados definitivamente
db.exec(
  "DELETE FROM movimientos WHERE socio_id NOT IN (SELECT id FROM socios)",
);

// ---------- Utilidad ----------
function sumarDias(fechaISO, dias) {
  const f = new Date(fechaISO + "T00:00:00");
  f.setDate(f.getDate() + dias);
  return f.toISOString().slice(0, 10);
}
const hoy = () => new Date().toISOString().slice(0, 10);

// ---------- Membresías ----------
function crearMembresia(nombre, duracion_dias, precio) {
  return db
    .prepare(
      "INSERT INTO membresias (nombre, duracion_dias, precio) VALUES (?, ?, ?)",
    )
    .run(nombre, duracion_dias, precio).lastInsertRowid;
}

// ---------- Socios ----------
function registrarSocio(nombre, telefono, email) {
  const id = db
    .prepare("INSERT INTO socios (nombre, telefono, email) VALUES (?, ?, ?)")
    .run(nombre, telefono, email || null).lastInsertRowid;
  db.prepare(
    "INSERT INTO movimientos (tipo, socio_id, nombre) VALUES ('ALTA', ?, ?)",
  ).run(id, nombre);
  return id;
}

// Baja = el socio queda inactivo (no se borra, se conserva su historial)
function darDeBaja(socio_id) {
  const s = db
    .prepare("SELECT * FROM socios WHERE id = ? AND activo = 1")
    .get(socio_id);
  if (!s) throw new Error("Socio no existe o ya está de baja");
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE socios SET activo = 0 WHERE id = ?").run(socio_id);
    db.prepare(
      "INSERT INTO movimientos (tipo, socio_id, nombre) VALUES ('BAJA', ?, ?)",
    ).run(socio_id, s.nombre);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function listarSocios() {
  return db
    .prepare(
      `
    SELECT s.id, s.nombre, s.telefono, s.email, s.fecha_vencimiento, m.nombre AS membresia
    FROM socios s LEFT JOIN membresias m ON m.id = s.membresia_id
    WHERE s.activo = 1 ORDER BY s.id DESC`,
    )
    .all();
}
function listarBajas() {
  return db
    .prepare(
      `
    SELECT s.id, s.nombre, s.telefono, s.email, s.fecha_vencimiento, m.nombre AS membresia
    FROM socios s LEFT JOIN membresias m ON m.id = s.membresia_id
    WHERE s.activo = 0 ORDER BY s.id DESC`,
    )
    .all();
}

// Elimina para siempre a un socio que YA está de baja, junto con sus pagos y asistencias
function eliminarDefinitivo(socio_id) {
  const s = db
    .prepare("SELECT * FROM socios WHERE id = ? AND activo = 0")
    .get(socio_id);
  if (!s)
    throw new Error("Solo se pueden eliminar socios que ya están de baja");
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM asistencias WHERE socio_id = ?").run(socio_id);
    db.prepare("DELETE FROM pagos WHERE socio_id = ?").run(socio_id);
    db.prepare("DELETE FROM movimientos WHERE socio_id = ?").run(socio_id);
    db.prepare("DELETE FROM socios WHERE id = ?").run(socio_id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function listarMembresias() {
  return db.prepare("SELECT * FROM membresias ORDER BY id").all();
}
function listarMovimientos(limite = 30) {
  return db
    .prepare("SELECT * FROM movimientos ORDER BY id DESC LIMIT ?")
    .all(limite);
}

// ---------- Pagos (renueva la membresía) ----------
function registrarPago(socio_id, membresia_id) {
  const m = db
    .prepare("SELECT * FROM membresias WHERE id = ?")
    .get(membresia_id);
  const s = db.prepare("SELECT * FROM socios WHERE id = ?").get(socio_id);
  if (!m || !s) throw new Error("Socio o membresía no existe");

  // Si aún está vigente, se suma desde su vencimiento; si no, desde hoy
  const base =
    s.fecha_vencimiento && s.fecha_vencimiento > hoy()
      ? s.fecha_vencimiento
      : hoy();
  const nuevoVenc = sumarDias(base, m.duracion_dias);

  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO pagos (socio_id, membresia_id, monto) VALUES (?, ?, ?)",
    ).run(socio_id, membresia_id, m.precio);
    db.prepare(
      "UPDATE socios SET membresia_id = ?, fecha_vencimiento = ? WHERE id = ?",
    ).run(membresia_id, nuevoVenc, socio_id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return nuevoVenc;
}

// ---------- Asistencia (solo si la membresía está vigente) ----------
function registrarAsistencia(socio_id) {
  const s = db.prepare("SELECT * FROM socios WHERE id = ?").get(socio_id);
  if (!s) return { ok: false, motivo: "Socio no existe" };
  if (!s.fecha_vencimiento || s.fecha_vencimiento < hoy()) {
    return {
      ok: false,
      motivo: `Membresía vencida (${s.fecha_vencimiento ?? "sin membresía"})`,
    };
  }
  db.prepare("INSERT INTO asistencias (socio_id) VALUES (?)").run(socio_id);
  return { ok: true, motivo: `Bienvenido, ${s.nombre}` };
}

// ---------- Consultas ----------
function sociosPorVencer(dias = 7) {
  return db
    .prepare(
      `
    SELECT nombre, fecha_vencimiento FROM socios
    WHERE fecha_vencimiento BETWEEN ? AND ?
    ORDER BY fecha_vencimiento`,
    )
    .all(hoy(), sumarDias(hoy(), dias));
}
function sociosVencidos() {
  return db
    .prepare(
      `
    SELECT nombre, fecha_vencimiento FROM socios
    WHERE fecha_vencimiento < ? ORDER BY fecha_vencimiento`,
    )
    .all(hoy());
}
function ingresosDelMes() {
  return db
    .prepare(
      `
    SELECT COALESCE(SUM(monto), 0) AS total FROM pagos
    WHERE strftime('%Y-%m', fecha_pago) = strftime('%Y-%m', 'now')`,
    )
    .get().total;
}

module.exports = {
  db,
  crearMembresia,
  registrarSocio,
  darDeBaja,
  listarBajas,
  eliminarDefinitivo,
  listarSocios,
  listarMembresias,
  listarMovimientos,
  registrarPago,
  registrarAsistencia,
  sociosPorVencer,
  sociosVencidos,
  ingresosDelMes,
};
