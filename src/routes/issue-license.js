// src/routes/issue-license.js

import { randomUUID } from 'node:crypto';
import { validateLicenseLimits } from '../lib/validateLicenseLimits.js';

/**
 * Register the POST /issue-license route
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function issueLicenseRoute(fastify) {
  fastify.post('/issue-license', async (request, reply) => {
    const { tier, product_id, issued_to, expires_at, limits } = request.body;

    // Basic required fields
    if (!tier || !product_id || !issued_to || !expires_at) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    // Validate limits structure
    const { valid, error } = validateLicenseLimits(limits || {});
    if (!valid) {
      return reply.status(400).send({ error });
    }

    const db = fastify.sqlite;
    const licenseKey = randomUUID();

    try {
      db.prepare(
        `
  INSERT INTO license_keys (key, tier, expires_at, issued_to, limits, product_id)
  VALUES (?, ?, ?, ?, ?, ?)
`
      ).run(
        licenseKey,
        tier,
        expires_at,
        issued_to,
        JSON.stringify(limits || {}),
        product_id
      );

      return reply.send({ key: licenseKey, status: 'issued' });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to issue license' });
    }
  });
}
