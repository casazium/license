// src/routes/delete-license.js

/**
 * Register the DELETE /delete-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function deleteLicenseRoute(fastify) {
  fastify.delete('/delete-license', async (request, reply) => {
    const db = fastify.sqlite;
    const { key } = request.body || {};

    const auth = request.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    if (!key) {
      return reply.status(400).send({ error: 'License key is required' });
    }

    try {
      const result = db
        .prepare(`DELETE FROM license_keys WHERE key = ?`)
        .run(key);

      if (result.changes === 0) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      return reply.send({ key, deleted: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete license' });
    }
  });
}
