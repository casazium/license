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
      const license = db
        .prepare(`SELECT status FROM license_keys WHERE key = ?`)
        .get(key);

      if (!license) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      const alreadyRevoked = license.status === 'revoked';
      const alreadyActive = license.status === 'active';

      if ((revoked && alreadyRevoked) || (!revoked && alreadyActive)) {
        return reply
          .status(409)
          .send({ error: 'License already in desired state' });
      }

      const update = db.prepare(
        revoked
          ? `UPDATE license_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE key = ?`
          : `UPDATE license_keys SET status = 'active', revoked_at = NULL WHERE key = ?`
      );

      update.run(key);

      return reply.send({ key, status: revoked ? 'revoked' : 'active' });
    } catch (err) {
      fastify.log.error(err);
      return reply
        .status(500)
        .send({ error: 'Failed to update license status' });
    }
  });
}
