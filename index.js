// Dependences
const fastify = require('fastify')({ logger: true });
const path = require('path');
const autoload = require('@fastify/autoload');

// Autoload all routes from the 'routes' directory
fastify.register(autoload, {
  dir: path.join(__dirname, 'routes'),
  options: { prefix: '/' },
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Servidor escuchando en http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();