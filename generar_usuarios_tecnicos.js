const bcrypt = require("./itam-web/node_modules/bcryptjs");

const nombres = [
  "JOSEPH", "JAMES", "PERCY", "ETSON", "DIEGO", "IRIS", "ALVARO", "DANIEL",
  "ANDRES", "DYLAN", "MARCELO", "MICHAEL", "ALEXIS", "JOSE", "SHEYLA", "SAMUEL",
];
const password = "Beru@2026";
const adminId = "d5ac3a9a-7f38-483c-b7f1-4b3bf5f0ba37";
// pgcrypto soporta $2a$; bcryptjs emite $2b$. Para contrasenas ASCII el hash es equivalente.
const hash = bcrypt.hashSync(password, 10).replace(/^\$2b\$/, "$2a$");

const esc = (v) => v.replace(/'/g, "''");
const filas = nombres.map((nombre, i) => {
  const doc = String(90000001 + i);
  const codigo = `TEC-${String(i + 1).padStart(3, "0")}`;
  const correo = `${nombre}@soporte.beru.local`;
  return `  ('${doc}', '${codigo}', '${esc(nombre)}', 'SOPORTE', '${correo}', '${nombre}', '${hash}', true, 'ACTIVO', 3, '${adminId}')`;
});

const sql = `-- Usuarios tecnicos de soporte creados desde los responsables migrados del Excel
-- Usuario: nombre en MAYUSCULAS. Contrasena inicial comun: ${password}
INSERT INTO public.usuarios (
  numero_documento, codigo_empleado, nombres, apellidos, correo_corporativo,
  username, password_hash, requiere_cambio_clave, estado_cuenta, id_rol, creado_por
)
VALUES
${filas.join(",\n")}
ON CONFLICT (username) DO NOTHING;

SELECT username, numero_documento, codigo_empleado, correo_corporativo, id_rol, estado_cuenta
FROM public.usuarios
WHERE username IN (${nombres.map((n) => `'${n}'`).join(", ")})
ORDER BY username;
`;

require("fs").writeFileSync("crear_usuarios_tecnicos.sql", sql, "utf8");
console.log("SQL generado:", "crear_usuarios_tecnicos.sql");
console.log("Hash:", hash);
