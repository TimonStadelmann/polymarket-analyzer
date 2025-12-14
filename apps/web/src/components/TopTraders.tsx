import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { fetchTopContrarianTraders } from '../lib/api';
import { TraderCard } from './traders/TraderCard';
import { TraderFilter } from './traders/TraderFilter';

interface TopTrader {
	trader_address: string;
	trader_name: string | null;
	trader_pseudonym: string | null;
	trader_image: string | null;
	contrarian_wins: number;
	total_investment: number;
	total_payout: number;
	profit: number;
	roi_percent: number;
	avg_entry_price: number;
	best_entry_price: number;
}

interface ApiResponse<T> {
	data: T;
}

export function TopTraders() {
	const [traders, setTraders] = useState<TopTrader[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [minWins, setMinWins] = useState(2);

	const loadData = (wins: number) => {
		setLoading(true);
		setError(null);

		fetchTopContrarianTraders(20, wins)
			.then((res: ApiResponse<TopTrader[]>) => {
				setTraders(res.data);
				setError(null);
			})
			.catch((err: Error) => {
				console.error('Failed to fetch top traders:', err);
				setError('Failed to load top traders.');
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadData(minWins);
	}, [minWins]);

	const handleMinWinsChange = (wins: number) => {
		setMinWins(wins);
	};

	const handleApply = () => {
		loadData(minWins);
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<h2 className="text-2xl font-semibold mb-4">Loading...</h2>
					<p className="text-muted-foreground">Fetching top traders...</p>
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
		<div className="space-y-6">
			<TraderFilter
				minWins={minWins}
				onMinWinsChange={handleMinWinsChange}
				onApply={handleApply}
			/>

			<Card>
				<CardHeader>
					<CardTitle>🎖️ Top Contrarian Traders</CardTitle>
					<CardDescription>
						Traders with the most successful contrarian wins (minimum {minWins} wins)
					</CardDescription>
					{traders.length > 0 && (
						<p className="text-sm text-muted-foreground mt-1">
							Found {traders.length} trader{traders.length !== 1 ? 's' : ''}
						</p>
					)}
				</CardHeader>
				<CardContent>
					{traders.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							No traders found with {minWins} or more contrarian wins
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{traders.map((trader, idx) => (
								<TraderCard
									key={trader.trader_address}
									trader={trader}
									rank={idx}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
