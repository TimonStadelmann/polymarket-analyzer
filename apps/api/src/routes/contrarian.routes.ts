import { FastifyInstance } from 'fastify';
import {
	getContrariansLeaderboard,
	getCategories,
	getSuccessRateByCategory,
	getTopContrarianTraders,
	getTraderNetwork,
	getMarketCorrelation,
	getCategoryFlow,
	getContrarianTimeline,
	getDatabaseStats,
} from '../services/neo4j.service.js';
import { z } from 'zod';

const leaderboardSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(20),
	category: z.string().optional(),
	minRoi: z.coerce.number().min(0).default(0),
	maxEntryPrice: z.coerce.number().min(0).max(1).default(0.2),
});

const successRateSchema = z.object({
	maxEntryPrice: z.coerce.number().min(0).max(1).default(0.2),
});

const topTradersSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(20),
	minWins: z.coerce.number().min(1).default(2),
	maxEntryPrice: z.coerce.number().min(0).max(1).default(0.2),
});

const traderNetworkSchema = z.object({
	minShared: z.coerce.number().min(1).default(2),
	limit: z.coerce.number().min(1).max(100).default(50),
});

const marketCorrelationSchema = z.object({
	minShared: z.coerce.number().min(1).default(3),
	limit: z.coerce.number().min(1).max(100).default(50),
});

const timelineSchema = z.object({
	maxEntryPrice: z.coerce.number().min(0).max(1).default(0.2),
});

export async function contrarianRoutes(fastify: FastifyInstance) {
	// GET /api/contrarians/leaderboard
	fastify.get('/api/contrarians/leaderboard', async (request, reply) => {
		try {
			const params = leaderboardSchema.parse(request.query);
			const data = await getContrariansLeaderboard(params);

			return {
				success: true,
				count: data.length,
				filters: params,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch contrarians leaderboard',
			});
		}
	});

	// GET /api/contrarians/categories
	fastify.get('/api/contrarians/categories', async (request, reply) => {
		try {
			const categories = await getCategories();
			return {
				success: true,
				data: categories,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch categories',
			});
		}
	});

	// GET /api/contrarians/success-rate
	fastify.get('/api/contrarians/success-rate', async (request, reply) => {
		try {
			const params = successRateSchema.parse(request.query);
			const data = await getSuccessRateByCategory(params.maxEntryPrice);

			return {
				success: true,
				count: data.length,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch success rate by category',
			});
		}
	});

	// GET /api/contrarians/top-traders
	fastify.get('/api/contrarians/top-traders', async (request, reply) => {
		try {
			const params = topTradersSchema.parse(request.query);
			const data = await getTopContrarianTraders(params);

			return {
				success: true,
				count: data.length,
				filters: params,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch top contrarian traders',
			});
		}
	});

	// Health check
	fastify.get('/api/health', async () => {
		return { status: 'ok', timestamp: new Date().toISOString() };
	});

	// GET /api/network/traders - Trader Network visualization
	fastify.get('/api/network/traders', async (request, reply) => {
		try {
			const params = traderNetworkSchema.parse(request.query);
			const data = await getTraderNetwork(params.minShared, params.limit);

			return {
				success: true,
				count: data.length,
				filters: params,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch trader network',
			});
		}
	});

	// GET /api/network/markets - Market Correlation visualization
	fastify.get('/api/network/markets', async (request, reply) => {
		try {
			const params = marketCorrelationSchema.parse(request.query);
			const data = await getMarketCorrelation(params.minShared, params.limit);

			return {
				success: true,
				count: data.length,
				filters: params,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch market correlation',
			});
		}
	});

	// GET /api/flow/categories - Category Flow visualization
	fastify.get('/api/flow/categories', async (request, reply) => {
		try {
			const data = await getCategoryFlow();

			return {
				success: true,
				count: data.length,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch category flow',
			});
		}
	});

	// GET /api/timeline/contrarian - Contrarian Timeline visualization
	fastify.get('/api/timeline/contrarian', async (request, reply) => {
		try {
			const params = timelineSchema.parse(request.query);
			const data = await getContrarianTimeline(params.maxEntryPrice);

			return {
				success: true,
				count: data.length,
				filters: params,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch contrarian timeline',
			});
		}
	});

	// GET /api/stats/database - Database Statistics and Health
	fastify.get('/api/stats/database', async (request, reply) => {
		try {
			const data = await getDatabaseStats();

			return {
				success: true,
				data,
			};
		} catch (error) {
			fastify.log.error(error);
			reply.status(500).send({
				success: false,
				error: 'Failed to fetch database stats',
			});
		}
	});
}
