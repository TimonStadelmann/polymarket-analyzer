import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { fetchDatabaseStats } from '../../lib/api';

interface DbStats {
	total_events: number;
	total_markets: number;
	total_users: number;
	total_trades: number;
	total_outcomes: number;
	resolved_markets: number;
	total_volume_usd: number;
}

interface DbHealth {
	status: string;
	timestamp: string;
}

interface DatabaseStatsData {
	stats: DbStats;
	health: DbHealth;
}

export function DatabaseStats() {
	const [stats, setStats] = useState<DbStats | null>(null);
	const [health, setHealth] = useState<DbHealth | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadStats = async () => {
			try {
				const response = await fetchDatabaseStats();
				setStats(response.data.stats);
				setHealth(response.data.health);
			} catch (err) {
				console.error('Failed to fetch database stats:', err);
			} finally {
				setLoading(false);
			}
		};

		loadStats();
		// Refresh every 30 seconds
		const interval = setInterval(loadStats, 30000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<Card className="w-64 bg-muted/50">
				<CardContent className="p-3">
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
						<span className="text-xs text-muted-foreground">Loading...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!stats || !health) {
		return null;
	}

	const isHealthy = health.status === 'healthy';
	const formatNumber = (num: number) => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	};

	return (
		<Card className="w-64 bg-muted/50 shadow-sm">
			<CardContent className="p-3">
				<div className="flex items-start justify-between mb-2">
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${
								isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
							}`}
							title={`Database ${health.status}`}
						></div>
						<span className="text-xs font-semibold text-foreground">Neo4j Status</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Events:</span>
						<span className="font-medium text-foreground">
							{formatNumber(stats.total_events)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Markets:</span>
						<span className="font-medium text-foreground">
							{formatNumber(stats.total_markets)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Traders:</span>
						<span className="font-medium text-foreground">
							{formatNumber(stats.total_users)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Trades:</span>
						<span className="font-medium text-foreground">
							{formatNumber(stats.total_trades)}
						</span>
					</div>
					<div className="flex justify-between col-span-2">
						<span className="text-muted-foreground">Volume:</span>
						<span className="font-medium text-foreground">
							${formatNumber(stats.total_volume_usd)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
