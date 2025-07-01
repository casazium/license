import { decrypt } from '../lib/crypto.js';
import { verifyLicenseSignature } from '../lib/license-signature.js';

/**
 * Register the POST /verify-license-file-base64 route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function verifyLicenseFileBase64Route(fastify) {
  fastify.post('/verify-license-file-base64', async (request, reply) => {
    // Optional: Enforce Content-Type
    // if (request.headers['content-type'] !== 'application/json') {
    //   return reply.status(400).send({ valid: false, reason: 'Expected application/json' });
    // }

    const { license_file } = request.body || {};
    const secret = process.env.LICENSE_SIGNING_SECRET;

    if (!secret) {
      return reply
        .status(500)
        .send({ valid: false, reason: 'Signing secret not configured' });
    }

    if (!license_file) {
      return reply
        .status(400)
        .send({ valid: false, reason: 'Missing license_file' });
    }

    try {
      const decrypted = decrypt(license_file);
      const license = JSON.parse(decrypted);

      // Validate expected fields
      if (
        typeof license !== 'object' ||
        !license.key ||
        !license.expires_at ||
        !license.sig
      ) {
        return reply
          .status(400)
          .send({ valid: false, reason: 'Incomplete license object' });
      }

      if (!verifyLicenseSignature(license, secret)) {
        return reply
          .status(403)
          .send({ valid: false, reason: 'Invalid signature' });
      }

      const now = new Date();
      const expiresAt = new Date(license.expires_at);
      if (expiresAt.getTime() < now.getTime()) {
        return reply.status(403).send({ valid: false, reason: 'Expired' });
      }

      const db = fastify.sqlite;
      const row = db
        .prepare('SELECT status FROM license_keys WHERE key = ?')
        .get(license.key);

      if (!row || row.status !== 'active') {
        return reply
          .status(403)
          .send({ valid: false, reason: 'Revoked or not found' });
      }

      return reply.send({ valid: true, reason: null, license });
    } catch (err) {
      fastify.log.error(
        { err, license_file },
        'Failed to verify base64 license'
      );
      return reply
        .status(400)
        .send({ valid: false, reason: 'Malformed or corrupt license_file' });
    }
  });
}
