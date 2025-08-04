// Dependences
const Crypto = require('crypto');
const { CustomDecrypt, CustomEncrypt, Encrypt, Decrypt } = require('../modules/CustomCrypto');
const RequestIp = require('request-ip');
const Supabase = require('../modules/DB-Client');
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
      return reply.send(Encrypt(JSON.stringify({ // If the request is not from an executor it return error
        Id: Crypto.randomUUID(),
        Status: 'UNAUTHORIZED_ACCESS'
      })));
    }

    // Check if the user is blacklisted
    const { data: blacklist, error: blacklistError } = await Supabase
      .from('Blacklist')
      .select('*')
      .or(`Ip.eq.${RequestIp.getClientIp(request)},Hwid.eq.${request.Hwid}`);

    if (blacklistError) {
      return reply.send(Encrypt(JSON.stringify({
        Id: Crypto.randomUUID(),
        Status: 'SCRIPT_CHECK_ERROR'
      })));
    }

    if (blacklist && blacklist.length > 0) {
      return reply.send(Encrypt(JSON.stringify({
        Id: Crypto.randomUUID(),
        Status: 'USER_BANNED'
      })));
    }
  });

  fastify.post('/auth/:Key', async (request, reply) => {
    try {
      // Getting user information
      const { Key } = request.params;
      const { Script, Seed } = request.body;
      const Ip = RequestIp.getClientIp(request);
      const RandomId = Crypto.randomUUID();

      // 1. Checking if all Information is complete
      if (!Key || !Script || !Seed) {
        return reply.send(Encrypt(JSON.stringify({
          Id: RandomId,
          Status: 'UNKNOWN_PARAMETERS'
        })));
      }

      // 2. Sanitizing User Information
      const isAlphanumeric = (str) => /^[a-zA-Z0-9]+$/.test(str);
      if (![Key, Seed].every(isAlphanumeric)) {
        return reply.send(Encrypt(JSON.stringify({ // In normal condition the client cant modify the request so this always will be an attempt of Injection attack
          Id: RandomId,
          Status: 'INJECTION_ATTEMPT'
        })));
      }

      const RealCryptKey = Decrypt(Seed);

      // 3. Checking if the Key exists (Comparing the Hashed Key)
      const HashedKey = Crypto
        .createHmac('sha256', HMAC_KEY)
        .update(Key)
        .digest('hex');

      const { data: User, error: ErrorFound } = await Supabase
        .from('Whitelist')
        .select('*')
        .eq('Key', HashedKey)
        .single();

      if (ErrorFound || !User) {
        return reply.send(CustomEncrypt(JSON.stringify({
          Id: RandomId,
          Status: 'INVALID_KEY'
        }), RealCryptKey));
      }

      // 4. Checking if the identifier is valid
      const Identifier = User['IP-Whitelist'] ? Ip : request.Hwid; // My whitelist have 2 methods of whitelist (Ip, Hwid) depending on which one you use the identifier to check will be one or other respecting.

      console.log(Identifier)

      if (User.Identifier !== Identifier) {
        return reply.send(CustomEncrypt(JSON.stringify({
          Id: RandomId,
          Status: 'INVALID_IDENTIFIER'
        }), RealCryptKey));
      }

      // 5. Checking if the key are expired or if its still valid
      if (User['Expire-Time'] !== 3600) { // If the Expire-Time is 3600 then is permanent thats why its skip the verifications
        const Registered = new Date(User.Registered);
        const TimeNow = new Date();
        const ExpirationDate = new Date(Registered);
        ExpirationDate.setDate(Registered.getDate() + User['Expire-Time']);

        if (TimeNow > ExpirationDate) {
          return reply.send(CustomEncrypt(JSON.stringify({
            Id: RandomId,
            Status: 'EXPIRED_KEY'
          }), RealCryptKey));
        }
      }

      // 6. Checking if the script requested exists and if the user is allowed to execute it
      const Scripts = User.Scripts || {};
      const ScriptData = Scripts[Script];

      if (!ScriptData) { // Script dont exists
        return reply.send(CustomEncrypt(JSON.stringify({
          Id: RandomId,
          Status: 'INVALID_SCRIPT'
        }), RealCryptKey));
      }

      if (!ScriptData.access) { // The user dont have access to this script (The user did not bought this script)
        return reply.send(CustomEncrypt(JSON.stringify({
          Id: RandomId,
          Status: 'UNALLOWED_SCRIPT'
        }), RealCryptKey));
      }

      // 7. Check script access duration associated with the user
      const Duration = ScriptData.duration;
      const Registered = new Date(ScriptData.registered);
      const ExpirationDate = new Date(Registered);
      ExpirationDate.setDate(Registered.getDate() + Duration);

      const TimeNow = new Date();
      if (Duration !== 3600 && TimeNow > ExpirationDate) { // If the duration is 3600 its skip the verification
        Scripts[Script].access = false; // If their script access expired then set the access to false

        await Supabase
          .from('Whitelist')
          .update({ Scripts: Scripts })
          .eq('id', User.id);

        return reply.send(CustomEncrypt(JSON.stringify({
          Id: RandomId,
          Status: 'EXPIRED_SCRIPT'
        }), RealCryptKey));
      }

      // 7. Server Response
      const UnixExpirationTime = Math.floor(ExpirationDate.getTime() / 1000);
      return reply.send(CustomEncrypt(JSON.stringify({
        Id: RandomId,
        Status: 'WHITELISTED',
        Executions: User.Executions,
        Discord: User.Discord,
        Note: User.Note,
        Time: UnixExpirationTime
      }), RealCryptKey));
    } catch (err) {
      // If any error ocurr during authentication then return error
      console.log(err)
      return reply.send(Encrypt(JSON.stringify({
        Id: Crypto.randomUUID(),
        Status: 'AUTH_ERROR'
      })));
    }
  });
}

module.exports = routes;
