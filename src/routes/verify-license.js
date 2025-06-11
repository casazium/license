// src/routes/verify-license.js

/**
 * Register the POST /verify-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function verifyLicenseRoute(fastify) {
  fastify.post('/verify-license', async (request, reply) => {
    const { key } = request.body;

    if (!key) {
      return reply.status(400).send({ error: 'License key is required' });
    }

    const db = fastify.sqlite;

    try {
      const row = db
        .prepare(`SELECT * FROM license_keys WHERE key = ?`)
        .get(key);

      if (!row) {
        return reply
          .status(404)
          .send({ valid: false, error: 'License key not found' });
      }

      const now = new Date();
      const expiresAt = new Date(row.expires_at);

      if (row.status !== 'active') {
        return reply
          .status(403)
          .send({ valid: false, error: 'License is not active' });
      }

      if (expiresAt < now) {
        return reply
          .status(403)
          .send({ valid: false, error: 'License has expired' });
      }

      return reply.send({
        valid: true,
        tier: row.tier,
        product_id: row.product_id,
        limits: row.limits ? JSON.parse(row.limits) : {},
        expires_at: row.expires_at,
        issued_to: row.issued_to,
        issued_at: row.issued_at,
        status: row.status,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to verify license' });
    }
  });
}
