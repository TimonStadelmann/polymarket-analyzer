import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileLink } from '@/components/ui/profile-link';
import { AddressCell } from '@/components/ui/address-cell';
import { StatsGrid } from './StatsGrid';

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

interface TraderCardProps {
	trader: TopTrader;
	rank: number;
}

export function TraderCard({ trader, rank }: TraderCardProps) {
	const displayName = trader.trader_name || trader.trader_pseudonym;
	const initials = (displayName || trader.trader_address)
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	const isTopThree = rank < 3;
	const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;

	return (
		<Card className={isTopThree ? 'bg-yellow-50' : ''}>
			<CardContent className="p-6 space-y-4">
				{/* Rank Badge */}
				<div className="text-2xl font-bold">{rankEmoji}</div>

				{/* Trader Info */}
				<div className="flex items-center gap-3">
					<Avatar className="h-12 w-12">
						{trader.trader_image && (
							<AvatarImage
								src={trader.trader_image}
								alt={displayName || trader.trader_address}
							/>
						)}
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						{displayName ? (
							<>
								<ProfileLink
									username={trader.trader_name || trader.trader_pseudonym}
									address={trader.trader_address}
								>
									<div className="font-semibold text-lg truncate overflow-hidden">
										{displayName}
									</div>
								</ProfileLink>
								<AddressCell
									address={trader.trader_address}
									className="text-xs text-muted-foreground"
								/>
							</>
						) : (
							<AddressCell address={trader.trader_address} />
						)}
					</div>
				</div>

				{/* Stats Grid */}
				<StatsGrid trader={trader} />

				{/* Additional Info */}
				<div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
					<div>Total Investment: ${trader.total_investment.toFixed(2)}</div>
					<div>Total Payout: ${trader.total_payout.toFixed(2)}</div>
					<div>Avg Entry: {(trader.avg_entry_price * 100).toFixed(2)}%</div>
				</div>
			</CardContent>
		</Card>
	);
}
