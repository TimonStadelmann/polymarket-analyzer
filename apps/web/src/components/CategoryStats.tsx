import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { fetchSuccessRateByCategory } from '../lib/api';
import { CategoryStatsTable } from './stats/CategoryStatsTable';
import { InsightsPanel } from './stats/InsightsPanel';

interface CategoryStat {
	category: string;
	total_contrarian_bets: number;
	winning_bets: number;
	success_rate: number;
	winning_volume: number;
	total_volume: number;
	avg_entry_price: number;
}

interface ApiResponse<T> {
	data: T;
}

export function CategoryStats() {
	const [stats, setStats] = useState<CategoryStat[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchSuccessRateByCategory()
			.then((res: ApiResponse<CategoryStat[]>) => {
				setStats(res.data);
				setError(null);
			})
			.catch((err: Error) => {
				console.error('Failed to fetch category stats:', err);
				setError('Failed to load category statistics.');
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<h2 className="text-2xl font-semibold mb-4">Loading...</h2>
					<p className="text-muted-foreground">Fetching category statistics...</p>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
					<p className="text-muted-foreground">{error}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>📊 Contrarian Success Rate by Category</CardTitle>
				<CardDescription>
					Which categories reward contrarian trading strategies most?
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<CategoryStatsTable stats={stats} />
				{stats.length > 0 && <InsightsPanel />}
			</CardContent>
		</Card>
	);
}
