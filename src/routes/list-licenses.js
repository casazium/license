// src/routes/list-licenses.js

/**
 * Register the GET /list-licenses route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function listLicensesRoute(fastify) {
  fastify.get('/list-licenses', async (request, reply) => {
    const db = fastify.sqlite;
    const { product_id, status, limit = 50, offset = 0 } = request.query;

    // Require admin access via a shared secret (e.g., for internal use only)
    const auth = request.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    try {
      const clauses = [];
      const params = { limit: Number(limit), offset: Number(offset) };

      if (product_id) {
        clauses.push('product_id = @product_id');
        params.product_id = product_id;
      }
      if (status) {
        clauses.push('status = @status');
        params.status = status;
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      const query = `
        SELECT key, tier, product_id, issued_to, issued_at, expires_at, status, usage_limit, usage_count, revoked_at
        FROM license_keys
        ${where}
        ORDER BY issued_at DESC
        LIMIT @limit OFFSET @offset
      `;

      const rows = db.prepare(query).all(params);

      return reply.send({ licenses: rows });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch licenses' });
    }
  });
}
