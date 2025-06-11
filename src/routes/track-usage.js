// src/routes/track-usage.js

/**
 * Register the POST /track-usage route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function trackUsageRoute(fastify) {
  fastify.post('/track-usage', async (request, reply) => {
    const db = fastify.sqlite;
    const { key, increment = 1 } = request.body || {};

    if (!key || typeof increment !== 'number' || increment < 1) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      const license = db
        .prepare(
          `
        SELECT usage_limit, usage_count, status, expires_at
        FROM license_keys WHERE key = ?
      `
        )
        .get(key);

      if (!license) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      if (license.status !== 'active') {
        return reply.status(403).send({ error: 'License is not active' });
      }

      if (new Date(license.expires_at) < new Date()) {
        return reply.status(403).send({ error: 'License is expired' });
      }

      const newCount = license.usage_count + increment;
      if (license.usage_limit !== null && newCount > license.usage_limit) {
        return reply.status(403).send({ error: 'Usage limit exceeded' });
      }

      db.prepare(`UPDATE license_keys SET usage_count = ? WHERE key = ?`).run(
        newCount,
        key
      );

      return reply.send({ ok: true, usage_count: newCount });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to track usage' });
    }
  });
}
