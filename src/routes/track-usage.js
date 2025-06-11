// src/routes/track-usage.js

/**
 * Register the POST /track-usage route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function trackUsageRoute(fastify) {
  fastify.post('/track-usage', async (request, reply) => {
    const db = fastify.sqlite;
    const { key, metric, increment = 1 } = request.body || {};

    if (!key || !metric || typeof increment !== 'number' || increment < 1) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      const row = db
        .prepare(
          `
        SELECT usage, limits, status, expires_at
        FROM license_keys WHERE key = ?
      `
        )
        .get(key);

      if (!row) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      if (row.status !== 'active') {
        return reply.status(403).send({ error: 'License is not active' });
      }

      if (new Date(row.expires_at) < new Date()) {
        return reply.status(403).send({ error: 'License is expired' });
      }

      const limits = JSON.parse(row.limits || '{}');
      const usage = JSON.parse(row.usage || '{}');

      if (!(metric in limits)) {
        return reply
          .status(403)
          .send({ error: `Metric not allowed: ${metric}` });
      }

      const newCount = (usage[metric] || 0) + increment;
      if (newCount > limits[metric]) {
        return reply
          .status(403)
          .send({ error: `Usage limit exceeded for metric: ${metric}` });
      }

      usage[metric] = newCount;
      db.prepare(`UPDATE license_keys SET usage = ? WHERE key = ?`).run(
        JSON.stringify(usage),
        key
      );

      return reply.send({ ok: true, metric, usage: newCount });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to track usage' });
    }
  });
}
