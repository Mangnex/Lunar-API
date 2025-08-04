// Dependences
const Supabase = require('../modules/DB-Client');
const Crypto = require('crypto');
const RequestIp = require('request-ip');
const HMAC_KEY = require('../configs').HMAC_KEY;

async function routes(fastify, options) {
  // Check if the request is from an executor
  fastify.addHook('preHandler', async (request, reply) => {
    const Headers = request.headers;
    const ExecutorIdentifier = Object.keys(Headers).find(header =>
      header.toLowerCase().endsWith('fingerprint') // All executors (atleast the knows one) have an unique identifier called fingerprint
    );

    if (ExecutorIdentifier) {
      request.Hwid = Headers[ExecutorIdentifier];
    } else {
      return reply.send({ // If the request is not from an executor it return error
        Id: RandomId,
        Status: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Check if the user is blacklisted
    const { data: blacklist, error: blacklistError } = await Supabase
      .from('Blacklist')
      .select('*')
      .or(`Ip.eq.${RequestIp.getClientIp(request)},Hwid.eq.${request.Hwid}`);

    if (blacklistError) {
      return reply.send({
        Id: RandomId,
        Status: 'SCRIPT_CHECK_ERROR',
      });
    }

    if (blacklist && blacklist.length > 0) {
      return reply.send({
        Id: RandomId,
        Status: 'USER_BANNED',
        Reason: reason
      });
    }
  });

  fastify.post('/status/:Username', async (request, reply) => {
    try {
      const { Username } = request.params;
      const { Executor, JobId } = request.body;
      const Hwid = request.Hwid;

      if (!Username || !Executor || !JobId) {
        return reply.send({ Message: 'MISSING_PARAMETERS' });
      }

      // Check if the input values are safe
      const isAlphanumeric = (str) => /^[a-zA-Z0-9]+$/.test(str);
      const isJobIdFormat = (str) => /^[a-zA-Z0-9\-]+$/.test(str);

      if (!isAlphanumeric(Username) || !isJobIdFormat(JobId) || !isAlphanumeric(Hwid)) {
        return reply.send({ Message: 'INJECTION_ATTEMPT' });
      }

      // Check User in our database
      const hashedUsername = Crypto
        .createHmac('sha256', HMAC_KEY)
        .update(Username)
        .digest('hex');

      const now = new Date(); // Timestamp now

      const { data: existing, error: fetchError } = await Supabase
        .from('Users')
        .select('*')
        .eq('Username', hashedUsername)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return reply.send({ Message: 'FAILED_CONNECTION' });
      }

      // If the User Dont exists
      if (!existing) {
        const { error: insertError } = await Supabase
          .from('Users')
          .insert({
            Username: hashedUsername,
            Executor,
            JobId,
            Status: 'Online',
            Identifier: Hwid,
            Timestamp: now
          });

        if (insertError) {
          return reply.send({ Message: 'ERROR_SAVING' });
        }

        return reply.send({ Message: 'USER_REGISTERED' });
      }

      // Saving if the user already exists
      if (existing.JobId !== JobId || existing.Status !== 'Online') {
        const { Message: updateError } = await Supabase
          .from('Users')
          .update({
            JobId,
            Status: 'Online',
            Identifier: Hwid,
            Timestamp: now
          })
          .eq('Username', hashedUsername);

        if (updateError) {
          return reply.send({ Message: 'ERROR_SAVING' });
        }

        return reply.send({ Message: 'USER_ONLINE' });
      }

      // Updating online Status
      const { Message: pingOnlyError } = await Supabase
        .from('Users')
        .update({ Timestamp: now })
        .eq('Username', hashedUsername);

      if (pingOnlyError) {
        return reply.send({ Message: 'USER_STATUS_UPDATE_ERROR' });
      }

      return reply.send({ Message: 'USER_STATUS_UPDATE' });

    } catch (err) {
      return reply.send({ Message: 'INTERNAL_SERVER_ERROR' });
    }
  });
}

module.exports = routes;
