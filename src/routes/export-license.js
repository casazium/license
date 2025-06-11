// src/routes/export-license.js

import { signLicense } from '../lib/license-signature.js';

/**
 * Register GET /export-license/:key route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function exportLicenseRoute(fastify) {
  fastify.get('/export-license/:key', async (request, reply) => {
    const { key } = request.params;
    const db = fastify.sqlite;

    try {
      const row = db
        .prepare(`SELECT * FROM license_keys WHERE key = ?`)
        .get(key);

      if (!row) {
        return reply.status(404).send({ error: 'License key not found' });
      }

      const license = {
        key: row.key,
        tier: row.tier,
        product_id: row.product_id,
        issued_to: row.issued_to,
        expires_at: row.expires_at,
        limits: row.limits ? JSON.parse(row.limits) : {},
      };

      const secret = process.env.LICENSE_SIGNING_SECRET;
      if (!secret) {
        return reply
          .status(500)
          .send({ error: 'Signing secret not configured' });
      }

      license.sig = signLicense(license, secret);
      return reply.send(license);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to export license' });
    }
  });
}
