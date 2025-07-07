// src/routes/revoke-license.js

/**
 * Register the POST /revoke-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function revokeLicenseRoute(fastify) {
  fastify.post('/revoke-license', async (request, reply) => {
    const { key, revoked } = request.body || {};

    if (!key || typeof revoked !== 'boolean') {
      return reply
        .status(400)
        .send({ error: 'License key and revoked flag are required' });
    }

    const db = fastify.sqlite;

    try {
      const result = db
        .prepare(
          revoked
            ? `UPDATE license_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE key = ? AND status != 'revoked'`
            : `UPDATE license_keys SET status = 'active', revoked_at = NULL WHERE key = ? AND status = 'revoked'`
        )
        .run(key);

      if (result.changes === 0) {
        return reply
          .status(404)
          .send({ error: 'License key not found or already in desired state' });
      }

      return reply.send({ key, status: revoked ? 'revoked' : 'active' });
    } catch (err) {
      fastify.log.error(err);
      return reply
        .status(500)
        .send({ error: 'Failed to update license status' });
    }
  });
}
