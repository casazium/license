// src/routes/list-activations.js

/**
 * Register the GET /list-activations/:key route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function listActivationsRoute(fastify) {
  fastify.get('/list-activations/:key', async (request, reply) => {
    const { key } = request.params;

    if (!key) {
      return reply.status(400).send({ error: 'License key is required' });
    }

    const db = fastify.sqlite;

    try {
      const license = db
        .prepare(`SELECT 1 FROM license_keys WHERE key = ?`)
        .get(key);

      if (!license) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      const rows = db
        .prepare(
          `SELECT instance_id, activated_at FROM activations WHERE key = ? ORDER BY activated_at DESC`
        )
        .all(key);

      return reply.send({ key, activations: rows });
    } catch (err) {
      fastify.log.error({ err }, 'Failed to list activations');
      return reply
        .status(500)
        .send({ error: 'Failed to list activations for license key' });
    }
  });
}
