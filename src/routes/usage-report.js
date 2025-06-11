// src/routes/usage-report.js

/**
 * Register the POST /usage-report route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function usageReportRoute(fastify) {
  fastify.post('/usage-report', async (request, reply) => {
    const db = fastify.sqlite;
    const { key } = request.body || {};

    if (!key) {
      return reply.status(400).send({ error: 'License key is required' });
    }

    try {
      const row = db
        .prepare(
          `
        SELECT status, expires_at, limits, usage
        FROM license_keys
        WHERE key = ?
      `
        )
        .get(key);

      if (!row) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      const limits = JSON.parse(row.limits || '{}');
      const usage = JSON.parse(row.usage || '{}');

      const metrics = Object.keys(limits).map((metric) => {
        const limit = limits[metric];
        const used = usage[metric] || 0;
        return {
          metric,
          used,
          limit,
          remaining: Math.max(0, limit - used),
          exceeded: used > limit,
        };
      });

      return reply.send({
        valid: row.status === 'active' && new Date(row.expires_at) > new Date(),
        status: row.status,
        expires_at: row.expires_at,
        metrics,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply
        .status(500)
        .send({ error: 'Failed to generate usage report' });
    }
  });
}
