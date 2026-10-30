import type { FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import { getImageObject, StorageNotConfiguredError } from "../../shared/storage.service";

// Only keys the app itself writes (see createImageUploadUrl) are ever
// served — anything else in the bucket stays unreachable through here.
const SERVABLE_KEY =
  /^presskits\/[A-Za-z0-9_-]+\/(gallery|theme-bg|cover|avatar|logo|section-bg|files|videos)\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|pdf|zip|docx|pptx|mp3|mp4|m4v|webm|mov)$/;
const ATTACHMENT_EXTENSIONS = new Set(["zip", "docx", "pptx", "mp3"]);

/**
 * Public read path for uploaded images. Railway buckets are private (no
 * anonymous GET), so the API streams objects out itself under /media/<key>
 * and that URL is what gets stored as the image's public URL. Keys are
 * random and never reused, so the response is cacheable forever — browsers
 * and any CDN in front of the API do the heavy lifting after the first hit.
 */
export async function storageRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ["GET", "HEAD"],
    url: "/media/*",
    handler: async (request, reply) => {
      const key = (request.params as { "*": string })["*"];
      if (!SERVABLE_KEY.test(key)) return reply.status(404).send({ error: "NOT_FOUND" });

      let object;
      try {
        // Only a single "bytes=a-b" range is passed on (what <video> sends).
        const range = request.headers.range;
        object = await getImageObject(key, range && /^bytes=\d*-\d*$/.test(range) ? range : undefined);
      } catch (error) {
        if (error instanceof StorageNotConfiguredError) throw error;
        return reply.status(404).send({ error: "NOT_FOUND" });
      }

      reply.header("Cache-Control", "public, max-age=31536000, immutable");
      reply.header("Content-Type", object.contentType);
      if (object.contentLength !== undefined) reply.header("Content-Length", String(object.contentLength));
      reply.header("Accept-Ranges", "bytes");
      if (object.contentRange) {
        reply.header("Content-Range", object.contentRange);
        reply.status(206);
      }
      if (object.etag) reply.header("ETag", object.etag);
      // Images embed anywhere (OG scrapers, other sites linking the presskit).
      reply.header("Access-Control-Allow-Origin", "*");
      // helmet's default `same-origin` makes the browser refuse to render
      // these on presskitai.com.br / app.presskitai.com.br (another origin
      // than api.*), even though the response itself is a 200.
      reply.header("Cross-Origin-Resource-Policy", "cross-origin");
      reply.header("X-Content-Type-Options", "nosniff");
      // Documents open inline (PDF viewer); archives/audio are offered as a
      // download with a readable name instead of the random key.
      const extension = key.split(".").pop()?.toLowerCase() ?? "";
      if (ATTACHMENT_EXTENSIONS.has(extension)) {
        const name =
          (request.query as { name?: string }).name?.replace(/[^\w.\- ]/g, "").slice(0, 80) || `arquivo.${extension}`;
        reply.header("Content-Disposition", `attachment; filename="${name}"`);
      }

      if (request.method === "HEAD") return reply.send();
      return reply.send(object.body instanceof Readable ? object.body : Readable.from(object.body));
    },
  });
}
