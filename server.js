// Servidor web del gimnasio (solo módulos integrados de Node, sin instalar nada)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const g = require("./gimnasio");

const PUERTO = 3000;

// Si no hay planes, crea unos de ejemplo
if (g.listarMembresias().length === 0) {
  g.crearMembresia("Mensual", 30, 500);
  g.crearMembresia("Trimestral", 90, 1300);
  g.crearMembresia("Anual", 365, 4500);
}

function responder(res, codigo, datos) {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(datos));
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let texto = "";
    req.on("data", (parte) => (texto += parte));
    req.on("end", () => {
      try {
        resolve(JSON.parse(texto || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

const servidor = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  try {
    // ----- API -----
    if (req.method === "GET" && pathname === "/api/socios") {
      return responder(res, 200, g.listarSocios());
    }
    if (req.method === "GET" && pathname === "/api/bajas") {
      return responder(res, 200, g.listarBajas());
    }
    if (req.method === "GET" && pathname === "/api/membresias") {
      return responder(res, 200, g.listarMembresias());
    }
    if (req.method === "GET" && pathname === "/api/movimientos") {
      return responder(res, 200, g.listarMovimientos());
    }
    if (req.method === "POST" && pathname === "/api/socios") {
      const { nombre, telefono, email, membresia_id } = await leerCuerpo(req);
      if (!nombre || !nombre.trim())
        return responder(res, 400, { error: "El nombre es obligatorio" });
      const id = g.registrarSocio(
        nombre.trim(),
        telefono || null,
        email || null,
      );
      if (membresia_id) g.registrarPago(id, Number(membresia_id));
      return responder(res, 201, { id });
    }
    const baja = pathname.match(/^\/api\/socios\/(\d+)\/baja$/);
    if (req.method === "POST" && baja) {
      g.darDeBaja(Number(baja[1]));
      return responder(res, 200, { ok: true });
    }

    const eliminar = pathname.match(/^\/api\/socios\/(\d+)$/);
    if (req.method === "DELETE" && eliminar) {
      g.eliminarDefinitivo(Number(eliminar[1]));
      return responder(res, 200, { ok: true });
    }

    // ----- Página -----
    if (
      req.method === "GET" &&
      (pathname === "/" || pathname === "/index.html")
    ) {
      const html = fs.readFileSync(
        path.join(__dirname, "public", "index.html"),
      );
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html);
    }

    responder(res, 404, { error: "No encontrado" });
  } catch (e) {
    const duplicado = String(e.message).includes("UNIQUE");
    responder(res, 400, {
      error: duplicado ? "Ese email ya está registrado" : e.message,
    });
  }
});

servidor.listen(PUERTO, () => {
  console.log(`Gimnasio listo en http://localhost:${PUERTO}`);
});
