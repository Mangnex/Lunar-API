// Dependences
const Supabase = require('../modules/DB-Client');

async function routes(fastify, options) {
  fastify.get('/get-users/:JobId', async (request, reply) => {
    const { JobId } = request.params;

      // Check if the input values are safe
      const isJobIdFormat = (str) => /^[a-zA-Z0-9\-]+$/.test(str);

      if (!isJobIdFormat(JobId)) {
        return reply.send({ Message: 0 });
      }

    const { count, error } = await Supabase
      .from('Users')
      .select('id', { count: 'exact', head: true })
      .eq('JobId', JobId);

    if (error) {
      return reply.send({ Message: 0 });
    }
    return reply.send({ count: count });
  });
}

module.exports = routes;
