// src/routes/list-licenses.js

import { requireAdmin } from '../hooks/require-admin.js';

/**
 * Register the GET /list-licenses route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function listLicensesRoute(fastify) {
  fastify.get(
    '/list-licenses',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const db = fastify.sqlite;
      const { product_id, status, limit = 50, offset = 0 } = request.query;

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
          SELECT
            key,
            tier,
            product_id,
            issued_to,
            issued_at,
            expires_at,
            status,
            usage_limit,
            usage_count,
            revoked_at
          FROM license_keys
          ${where}
          ORDER BY issued_at DESC
          LIMIT @limit OFFSET @offset
        `;

        const licenses = db.prepare(query).all(params);
        return reply.send({ licenses });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Failed to fetch licenses' });
      }
    }
  );
}
