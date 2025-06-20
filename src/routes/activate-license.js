// src/routes/activate-license.js

/**
 * Register the POST /activate-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function activateLicenseRoute(fastify) {
  fastify.post('/activate-license', async (request, reply) => {
    const { key, instance_id } = request.body;

    if (!key || !instance_id) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const db = fastify.sqlite;

    try {
      const license = db
        .prepare(`SELECT * FROM license_keys WHERE key = ?`)
        .get(key);

      if (!license) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      if (license.revoked_at) {
        return reply.status(403).send({ error: 'License has been revoked' });
      }

      const now = new Date();
      const expiresAt = new Date(license.expires_at);
      if (now > expiresAt) {
        return reply.status(403).send({ error: 'License has expired' });
      }

      const existing = db
        .prepare(`SELECT 1 FROM activations WHERE key = ? AND instance_id = ?`)
        .get(key, instance_id);

      if (existing) {
        return reply.send({ activated: true, alreadyActivated: true });
      }

      const currentCount = db
        .prepare(`SELECT COUNT(*) AS count FROM activations WHERE key = ?`)
        .get(key).count;

      if (
        typeof license.max_activations === 'number' &&
        currentCount >= license.max_activations
      ) {
        return reply.status(403).send({
          error: 'Activation limit exceeded for this license key',
        });
      }

      db.prepare(
        `INSERT INTO activations (key, instance_id) VALUES (?, ?)`
      ).run(key, instance_id);

      return reply.send({ activated: true });
    } catch (err) {
      fastify.log.error({ err }, 'Failed to activate license');
      return reply.status(500).send({ error: 'Failed to activate license' });
    }
  });
}
