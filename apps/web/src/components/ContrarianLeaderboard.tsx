import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { fetchContrariansLeaderboard, fetchCategories } from '../lib/api';
import { LeaderboardFilters, type FilterValues } from './LeaderboardFilters';
import { LeaderboardTable } from './leaderboard/LeaderboardTable';

interface ContrarianTrade {
	trader_address: string;
	trader_name: string | null;
	trader_pseudonym: string | null;
	trader_image: string | null;
	market_question: string;
	market_slug: string;
	category: string;
	outcome: string;
	entry_price: number;
	investment_usd: number;
	payout_usd: number;
	roi_percent: number;
	trade_time: string;
	tx_hash: string;
}

interface ApiResponse<T> {
	data: T;
}

export function ContrarianLeaderboard() {
	const [trades, setTrades] = useState<ContrarianTrade[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<FilterValues>({
		limit: 20,
		category: 'All',
		minRoi: 0,
		maxEntryPrice: 0.2,
	});

	// Fetch categories on mount
	useEffect(() => {
		fetchCategories()
			.then((res: ApiResponse<string[]>) => setCategories(res.data))
			.catch((err: Error) => console.error('Failed to load categories:', err));
	}, []);

	// Fetch leaderboard data when filters change
	useEffect(() => {
		const controller = new AbortController();

		fetchContrariansLeaderboard(filters)
			.then((res: ApiResponse<ContrarianTrade[]>) => {
				if (!controller.signal.aborted) {
					setTrades(res.data);
					setError(null);
					setLoading(false);
				}
			})
			.catch((err: Error) => {
				if (!controller.signal.aborted) {
					console.error('Failed to fetch leaderboard:', err);
					setError(
						'Failed to load contrarian trades. Please check if the backend is running on port 3000.'
					);
					setLoading(false);
				}
			});

		return () => controller.abort();
	}, [filters]);

	const handleFilterChange = (newFilters: FilterValues) => {
		setLoading(true);
		setFilters(newFilters);
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<LeaderboardFilters onFilterChange={handleFilterChange} categories={categories} />
				<Card>
					<CardContent className="p-6">
						<h2 className="text-2xl font-semibold mb-4">Loading...</h2>
						<p className="text-muted-foreground">Fetching contrarian traders data...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<LeaderboardFilters onFilterChange={handleFilterChange} categories={categories} />
				<Card>
					<CardContent className="p-6">
						<h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
						<p className="text-muted-foreground">{error}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<LeaderboardFilters onFilterChange={handleFilterChange} categories={categories} />

			<Card>
				<CardHeader>
					<CardTitle>🏆 Top Contrarian Trades</CardTitle>
					<CardDescription>
						Individual trades where buyers bought winning outcomes at very low prices
						(entry &lt; {filters.maxEntryPrice * 100}%)
					</CardDescription>
					{trades.length > 0 && (
						<p className="text-sm text-muted-foreground mt-1">
							Showing {trades.length} result{trades.length !== 1 ? 's' : ''}
							{filters.category !== 'All' && ` in ${filters.category}`}
							{filters.minRoi > 0 && ` with ROI ≥ ${filters.minRoi}%`}
						</p>
					)}
				</CardHeader>
				<CardContent>
					<LeaderboardTable trades={trades} />
				</CardContent>
			</Card>
		</div>
	);
}
