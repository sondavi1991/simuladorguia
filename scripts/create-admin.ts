/**
 * Cria ou redefine a senha de um usuário administrador no PostgreSQL.
 *
 * Uso:
 *   ADMIN_PASSWORD='sua-senha-forte' npm run create-admin -- <usuario> [email]
 *
 * - A senha vem SEMPRE da variável ADMIN_PASSWORD (não por argumento, para não
 *   ficar no histórico do shell). Mínimo de 12 caracteres.
 * - Se o usuário já existir, a senha é trocada e as sessões ativas dele são
 *   encerradas. Use isto para substituir uma senha antiga/padrão em produção.
 * - Lê DATABASE_URL do ambiente ou do arquivo .env.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import pg from "pg";

const WEAK_PASSWORDS = new Set(["admin123", "admin", "password", "123456", "123456789", "12345678"]);

async function main() {
  const [username, email] = process.argv.slice(2);
  const password = process.env.ADMIN_PASSWORD;

  if (!username) {
    console.error("Uso: ADMIN_PASSWORD='...' npm run create-admin -- <usuario> [email]");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definida (ambiente ou .env).");
    process.exit(1);
  }
  if (!password || password.length < 12 || WEAK_PASSWORDS.has(password.toLowerCase())) {
    console.error("Defina ADMIN_PASSWORD com pelo menos 12 caracteres e que não seja uma senha comum.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const { rows } = await client.query(
      `INSERT INTO users (username, password, email, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username)
       DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
       RETURNING id, (xmax = 0) AS created`,
      [username, hash, email ?? null, "Administrador", "Sistema"]
    );

    const { id, created } = rows[0];
    if (!created) {
      await client.query("DELETE FROM sessions WHERE user_id = $1", [id]);
    }
    console.log(
      created
        ? `Usuário "${username}" criado.`
        : `Senha do usuário "${username}" redefinida e sessões antigas encerradas.`
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
