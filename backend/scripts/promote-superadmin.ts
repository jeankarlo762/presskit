// Promotes (or demotes with --demote) an existing account by e-mail.
//   npm run admin:promote --workspace=@presskit/api -- pessoa@email.com
//   npm run admin:promote --workspace=@presskit/api -- pessoa@email.com --demote
// On Railway, where there's no shell by default, prefer the SUPERADMIN_EMAILS
// env var (see config/env.ts) — this script is for local/CLI use.
import { prisma } from "../src/config/prisma";

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) {
    console.error("uso: promote-superadmin <email> [--demote]");
    process.exit(1);
  }
  const role = flag === "--demote" ? "USER" : "SUPERADMIN";

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    console.error(`Nenhuma conta com o e-mail ${email} — a pessoa precisa se cadastrar primeiro.`);
    process.exit(1);
  }

  if (role === "USER") {
    const others = await prisma.user.count({ where: { role: "SUPERADMIN", id: { not: user.id } } });
    if (others === 0) {
      console.error("Esse é o último superadmin — promova outra conta antes de rebaixar.");
      process.exit(1);
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${user.email} agora é ${role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
