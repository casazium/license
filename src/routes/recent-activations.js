// src/routes/recent-activations.js

/**
 * Register GET /recent-activations route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function recentActivationsRoute(fastify) {
  fastify.get('/recent-activations', async (request, reply) => {
    const db = fastify.sqlite;

    try {
      const rows = db
        .prepare(
          `
        SELECT key, instance_id, activated_at
        FROM activations
        ORDER BY activated_at DESC
        LIMIT 20
      `,
        )
        .all();

      return reply.send(rows);
    } catch (err) {
      fastify.log.error(err);
      return reply
        .status(500)
        .send({ error: 'Failed to fetch recent activations' });
    }
  });
}
