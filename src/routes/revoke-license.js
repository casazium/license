// src/routes/revoke-license.js

/**
 * Register the POST /revoke-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function revokeLicenseRoute(fastify) {
  fastify.post('/revoke-license', async (request, reply) => {
    const { key, reason } = request.body || {};

    if (!key) {
      return reply.status(400).send({ error: 'License key is required' });
    }

    const db = fastify.sqlite;

    try {
      const result = db
        .prepare(
          `
        UPDATE license_keys 
        SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP 
        WHERE key = ? AND status != 'revoked'
      `
        )
        .run(key);

      if (result.changes === 0) {
        return reply
          .status(404)
          .send({ error: 'License key not found or already revoked' });
      }

      return reply.send({ key, status: 'revoked', reason: reason || null });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to revoke license' });
    }
  });
}
