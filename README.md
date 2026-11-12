# Proyecto Gimnasio

Sistema para administrar un gimnasio: socios, membresías, pagos y asistencias. Incluye un servidor web local y una base de datos.

## Funciones

- Registrar socios y darlos de baja (con opción de eliminar definitivamente)
- Crear y listar membresías
- Registrar pagos y asistencias
- Consultar movimientos
- Ver socios por vencer
- Calcular los ingresos del mes

## Tecnologías

- JavaScript (Node.js)
- SQL (base de datos definida en `schema.sql`)
- HTML (interfaz en `public/index.html`)

## Estructura del proyecto

```
proyect.gym/
├── gimnasio.js        # Lógica del sistema (funciones de socios, pagos, etc.)
├── server.js          # Servidor web
├── demo.js            # Datos o ejemplo de demostración
├── schema.sql         # Estructura de la base de datos
├── public/
│   └── index.html     # Interfaz web
└── upch.mx.png        # Imagen
```

## Requisitos

- [Node.js](https://nodejs.org) instalado
- [Git](https://git-scm.com)

## Cómo ejecutarlo

1. Clona el repositorio:

```bash
git clone https://github.com/javiJs488/proyecto-gimnasio.git
cd proyecto-gimnasio
```

2. Instala las dependencias:

```bash
npm install
```

3. Inicia el servidor:

```bash
node server.js
```

4. Abre en tu navegador: http://localhost:3000

## Notas

- El archivo de base de datos (`gimnasio.db`) no se incluye en el repositorio. Se crea al ejecutar el proyecto a partir de `schema.sql`.
- Proyecto de aprendizaje.

## Autor

[javiJs488](https://github.com/javiJs488)
