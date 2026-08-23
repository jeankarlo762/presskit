// Local stand-in for Cloudflare R2 so image/video upload works in dev
// without a real Cloudflare account — same S3 API, backend/src/services
// storage.service.ts talks to it identically via STORAGE_ENDPOINT. Swap to
// real R2 vars in production; this script is dev-only tooling.
import S3rver from "s3rver";
import { join } from "node:path";

const PORT = 4568;
const BUCKET = "presskit-media";

const instance = new S3rver({
  port: PORT,
  address: "localhost",
  silent: false,
  directory: join(process.cwd(), ".s3rver-data"),
  resetOnClose: false,
  allowMismatchedSignatures: true,
  vhostBuckets: false,
  configureBuckets: [
    {
      name: BUCKET,
      configs: [
        // Permissive CORS so the browser can PUT directly from the Vite dev
        // server, same requirement real R2 has for direct browser uploads.
        `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>`,
      ],
    },
  ],
});

instance.run((err, { address, port } = {}) => {
  if (err) {
    console.error("Falha ao iniciar o storage local:", err);
    process.exit(1);
  }
  console.log(`Storage local (s3rver) rodando em http://${address}:${port} — bucket "${BUCKET}"`);
});
