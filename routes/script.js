// Dependences
const Supabase = require('../modules/DB-Client');
const RequestIp = require('request-ip');
const Webhook = require('../modules/Webhook');
const FileStorage = require('../configs').SCRIPT_STORAGE_NAME;

async function routes(fastify, options) {
  // Check if the request is from an executor
  fastify.addHook('preHandler', async (request, reply) => {
    request.Duration = Date.now();
    const Headers = request.headers;
    const ExecutorIdentifier = Object.keys(Headers).find(header =>
      header.toLowerCase().endsWith('fingerprint') // All executors (atleast the knows one) have an unique identifier called fingerprint
    );

    if (ExecutorIdentifier) {
      request.Hwid = Headers[ExecutorIdentifier];
    } else {
      return reply.send('game.Players.LocalPlayer:Kick("The script execution environment is not secure, please try again with a different executor!")');
    }

    // Check if the user is blacklisted
    const { data: blacklist, error: blacklistError } = await Supabase
      .from('Blacklist')
      .select('*')
      .or(`Ip.eq.${RequestIp.getClientIp(request)},Hwid.eq.${request.Hwid}`);

    if (blacklistError) {
      return reply.send('game.Players.LocalPlayer:Kick("Error during script request!")');
    }

    if (blacklist && blacklist.length > 0) {
      return reply.send('game.Players.LocalPlayer:Kick("You have been banned and will no longer be welcome on Lunar Hub!")');
    }
  });

  async function GetScript(path) {
    const { data, error } = await Supabase
      .storage
      .from(FileStorage)
      .download(path);

    if (error || !data) return null;

    const chunks = [];
    for await (const chunk of data.stream()) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  // For Scripts
  fastify.get('/script/:Name', async (request, reply) => {
    const { Name } = request.params;

    if (!/^[a-zA-Z]+$/.test(Name)) {
      return reply.send(await GetScript('Errors/InjectionAttempt.lua'));
    }

    const Script = await GetScript(`Scripts/${Name}.lua`);

    if (!Script) {
      return reply.send(await GetScript('Errors/ScriptNotFound.lua'));
    }

    // Increment Executions Stats
    const { data: ServerData, error: ErrorFound } = await Supabase
      .from('Server')
      .select('Executions')
      .eq('id', 1)
      .single();

    if (!ErrorFound && ServerData) {
      const Current = ServerData.Executions;
      await Supabase
        .from('Server')
        .update({ Executions: Current + 1 })
        .eq('id', 1);
    }

		await Webhook.Success({
      UserAgent: request.headers["user-agent"],
      Hwid: request.Hwid,
      Script: Name,
			Ip: RequestIp.getClientIp(request),
      Duration: Math.round((Date.now() - request.Duration) / 1000)
    });

    return reply.send(Script);
  });

  // For Libraries
  fastify.get('/library/:Name', async (request, reply) => {
    const { Name } = request.params;

    if (!/^[a-zA-Z]+$/.test(Name)) {
      return reply.send(await GetScript('Errors/InjectionAttempt.lua'));
    }

    const Library = await GetScript(`Libraries/${Name}.lua`);

    if (!Library) {
      return reply.send(await GetScript('Errors/ScriptNotFound.lua'));
    }

    return reply.send(Library);
  });

  // For Custom Scripts
  fastify.get('/custom-script/:Name', async (request, reply) => {
    const { Name } = request.params;

    if (!/^[a-zA-Z]+$/.test(Name)) {
      return reply.send(await GetScript('Errors/InjectionAttempt.lua'));
    }

    const Library = await GetScript(`CustomScripts/${Name}.lua`);

    if (!Library) {
      return reply.send(await GetScript('Errors/ScriptNotFound.lua'));
    }

    return reply.send(Library);
  });
}

module.exports = routes;
