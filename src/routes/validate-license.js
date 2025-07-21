// src/routes/validate-license.js

/**
 * Register the POST /validate-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function validateLicenseRoute(fastify) {
  fastify.post('/validate-license', async (request, reply) => {
    const { key, instance_id } = request.body;
    const db = fastify.sqlite;

    if (!key || !instance_id) {
      return reply.send({ valid: false });
    }

    try {
      const license = db
        .prepare(`SELECT * FROM license_keys WHERE key = ?`)
        .get(key);

      if (!license || license.revoked_at) {
        return reply.send({ valid: false });
      }

      const now = new Date();
      if (license.expires_at && now > new Date(license.expires_at)) {
        return reply.send({ valid: false });
      }

      const activated = db
        .prepare(`SELECT 1 FROM activations WHERE key = ? AND instance_id = ?`)
        .get(key, instance_id);

      const limits = license.limits ? JSON.parse(license.limits) : {};
      const activationLimit = limits.activations;

      if (!activated) {
        if (activationLimit) {
          const count = db
            .prepare(`SELECT COUNT(*) as total FROM activations WHERE key = ?`)
            .get(key).total;

          if (count >= activationLimit) {
            return reply.send({ valid: false });
          }
        }

        return reply.send({ valid: false });
      }

      return reply.send({ valid: true });
    } catch (err) {
      fastify.log.error({ err }, 'License validation failed');
      return reply.status(500).send({ error: 'License validation failed' });
    }
  });
}
