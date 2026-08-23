import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Railway sets real env vars directly (NODE_ENV=production included) — a .env
// file has no business overriding those, so this only runs for local dev.
// tsx (unlike some Node loaders) does not read .env files on its own, so
// without this the dev server silently ignores backend/.env entirely.
if (process.env.NODE_ENV !== "production") {
  loadDotenv();
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),

    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET precisa ter pelo menos 32 caracteres"),
    JWT_ACCESS_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

    CORS_ORIGINS: z.string().optional(),

    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.string().optional(),
    // Local-dev-only escape hatch: point the S3 client at a local
    // S3-compatible server (s3rver) instead of deriving the endpoint from
    // R2_ACCOUNT_ID, so image upload works without a real Cloudflare
    // account. Unset in production — real R2 always uses the account-ID
    // endpoint.
    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

    ASAAS_API_KEY: z.string().optional(),
    ASAAS_BASE_URL: z.string().default("https://api-sandbox.asaas.com/v3"),
    ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && !value.CORS_ORIGINS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS é obrigatório em produção (lista separada por vírgula)",
      });
    }
  });

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Variáveis de ambiente inválidas:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];
