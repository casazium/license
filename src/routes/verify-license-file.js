// src/routes/verify-license-file.js

import { verifyLicenseSignature } from '../lib/license-signature.js';

/**
 * Register the POST /verify-license-file route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function verifyLicenseFileRoute(fastify) {
  fastify.post('/verify-license-file', async (request, reply) => {
    const license = request.body;
    const secret = process.env.LICENSE_SIGNING_SECRET;

    if (!secret) {
      return reply
        .status(500)
        .send({ valid: false, reason: 'Signing secret not configured' });
    }

    try {
      if (!verifyLicenseSignature(license, secret)) {
        return reply
          .status(403)
          .send({ valid: false, reason: 'Invalid signature' });
      }

      const now = new Date();
      const expiresAt = new Date(license.expires_at);
      if (expiresAt < now) {
        return reply.status(403).send({ valid: false, reason: 'Expired' });
      }

      // (Optional) Check for revocation via DB
      const db = fastify.sqlite;
      const row = db
        .prepare('SELECT status FROM license_keys WHERE key = ?')
        .get(license.key);
      if (!row || row.status !== 'active') {
        return reply
          .status(403)
          .send({ valid: false, reason: 'Revoked or not found' });
      }

      return reply.send({ valid: true, reason: null });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ valid: false, reason: 'Internal error' });
    }
  });
}
