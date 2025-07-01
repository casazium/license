/**
 * Fastify preHandler hook to enforce ADMIN_API_KEY header auth
 * Usage: route opts: { preHandler: requireAdmin }
 */
export function requireAdmin(request, reply, done) {
  const auth = request.headers.authorization;
  const key = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;

  if (key !== process.env.ADMIN_API_KEY) {
    return reply.status(403).send({ error: 'Unauthorized' });
  }

  done(); // allow request to proceed
}
