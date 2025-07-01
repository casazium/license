// src/routes/export-license-file.js

import { signLicense } from '../lib/license-signature.js';
import { encrypt } from '../lib/crypto.js';

/**
 * Register GET /export-license/:key/file route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function exportLicenseFileRoute(fastify) {
  fastify.get('/export-license/:key/file', async (request, reply) => {
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

      const signingSecret = process.env.LICENSE_SIGNING_SECRET;
      if (!signingSecret) {
        return reply
          .status(500)
          .send({ error: 'Signing secret not configured' });
      }

      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        return reply
          .status(500)
          .send({ error: 'Encryption key not configured' });
      }

      license.sig = signLicense(license, signingSecret);

      const encrypted = encrypt(JSON.stringify(license));

      return reply
        .header('Content-Type', 'application/octet-stream')
        .header(
          'Content-Disposition',
          `attachment; filename=license-${key}.lic`
        )
        .send(encrypted);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to export license file' });
    }
  });
}
