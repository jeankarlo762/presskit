// Dev-only seed: creates a test login that bypasses the app's normal 8-char
// password policy (enforced by signupSchema at the route layer, not here) —
// "123" is only acceptable for local testing, never a real signup path.
import { prisma } from "../src/config/prisma";
import { createUser } from "../src/modules/auth/auth.service";
import { createPresskitForUser } from "../src/modules/presskit/presskit.service";
import { upsertSectionData } from "../src/modules/sections/section.service";

async function main() {
  const email = "admin@gmail.com";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await createUser({ name: "Artista Teste", email, password: "123" });
    console.log("Usuário criado:", email);
  } else {
    console.log("Usuário já existia:", email);
  }

  let presskit = await prisma.presskit.findUnique({ where: { userId: user.id } });
  if (!presskit) {
    presskit = await createPresskitForUser(user.id, "MUSICO_BANDA", "dj-teste");
    await upsertSectionData(
      presskit.id,
      "BIO",
      {
        shortBio: "DJ e produtor musical, sempre em busca do próximo beat.",
        longBio: "Biografia completa de teste — edite este texto no painel para ver o preview mudar em tempo real.",
      },
      "Sobre",
    );
    await upsertSectionData(presskit.id, "CONTACT", { email: "contato@djteste.com", socialLinks: [] }, "Contato");
    await prisma.presskit.update({ where: { id: presskit.id }, data: { published: true, city: "São Paulo", state: "SP" } });
    console.log("Presskit de teste criado: /dj-teste (já publicado)");
  } else {
    console.log("Presskit já existia para esse usuário");
  }

  console.log("\nLogin de teste:");
  console.log("  email: admin@gmail.com");
  console.log("  senha: 123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
