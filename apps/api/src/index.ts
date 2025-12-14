import Fastify from 'fastify';
import cors from '@fastify/cors';
import { contrarianRoutes } from './routes/contrarian.routes.js';
import { initNeo4jDriver, closeNeo4jDriver } from './services/neo4j.service.js';

const fastify = Fastify({
	logger: true,
});

// Register CORS
await fastify.register(cors, {
	origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
});

// Register routes
await fastify.register(contrarianRoutes);

// Initialize Neo4j connection
initNeo4jDriver();

// Graceful shutdown
const gracefulShutdown = async () => {
	fastify.log.info('Shutting down gracefully...');
	await closeNeo4jDriver();
	await fastify.close();
	process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
	try {
		const port = Number(process.env.PORT) || 3000;
		await fastify.listen({ port, host: '0.0.0.0' });
		fastify.log.info(`Server running on http://localhost:${port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
