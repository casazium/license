/**
 * Register the GET /admin-stats route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function adminStatsRoute(fastify) {
  fastify.get('/admin/stats', async (request, reply) => {
    const db = fastify.sqlite;

    try {
      const totalLicenses = db
        .prepare('SELECT COUNT(*) AS count FROM license_keys')
        .get().count;

      const activeLicenses = db
        .prepare(
          `SELECT COUNT(*) AS count FROM license_keys WHERE status = 'active'`
        )
        .get().count;

      const revokedLicenses = db
        .prepare(
          `SELECT COUNT(*) AS count FROM license_keys WHERE status = 'revoked'`
        )
        .get().count;

      const totalActivations = db
        .prepare('SELECT COUNT(*) AS count FROM activations')
        .get().count;

      const recentActivations = db
        .prepare(
          `SELECT key, instance_id, activated_at
           FROM activations
           ORDER BY activated_at DESC
           LIMIT 5`
        )
        .all();

      return reply.send({
        totalLicenses,
        activeLicenses,
        revokedLicenses,
        totalActivations,
        recentActivations,
      });
    } catch (err) {
      fastify.log.error({ err }, 'Failed to compute admin stats');
      return reply.status(500).send({ error: 'Failed to retrieve stats' });
    }
  });
}
