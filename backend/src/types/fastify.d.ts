import "fastify";
import type { User } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Runs after `authenticate`; rejects anyone whose role isn't SUPERADMIN. */
    requireSuperadmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Fresh read of a user row (after a route changed it). */
    prismaUser: (id: string) => Promise<User | null>;
  }
  interface FastifyRequest {
    currentUser: User;
    /** Which of the user's presskits the request is about (header
     * `X-Presskit-Id`); null = the account's primary page. Ownership is
     * checked by getOwnedPresskitOrThrow, never trusted from the header. */
    presskitId: string | null;
  }
}
