// Demo: llena datos de ejemplo y prueba las funciones
const g = require("./gimnasio");

// Reinicia datos para poder correr la demo varias veces
g.db.exec(
  "DELETE FROM movimientos; DELETE FROM asistencias; DELETE FROM pagos; DELETE FROM socios; DELETE FROM membresias;",
);

const mensual = g.crearMembresia("Mensual", 30, 500);
const trimestral = g.crearMembresia("Trimestral", 90, 1300);

const ana = g.registrarSocio("Ana López", "9371234567", "ana@mail.com");
const luis = g.registrarSocio("Luis Pérez", "9377654321", "luis@mail.com");
const rosa = g.registrarSocio("Rosa Díaz", "9371112233", "rosa@mail.com");

console.log("Ana vence:", g.registrarPago(ana, mensual));
console.log("Luis vence:", g.registrarPago(luis, trimestral));
// Rosa nunca pagó: no tiene membresía

console.log("\nAsistencia:");
console.log("Ana ->", g.registrarAsistencia(ana));
console.log("Luis ->", g.registrarAsistencia(luis));
console.log("Rosa ->", g.registrarAsistencia(rosa));

console.log("\nPor vencer (30 días):", g.sociosPorVencer(30));
console.log("Ingresos del mes: $" + g.ingresosDelMes());
