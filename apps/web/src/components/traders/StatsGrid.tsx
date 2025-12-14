interface TopTrader {
	contrarian_wins: number;
	profit: number;
	roi_percent: number;
	best_entry_price: number;
}

interface StatsGridProps {
	trader: TopTrader;
}

export function StatsGrid({ trader }: StatsGridProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<div>
				<div className="text-xs text-muted-foreground mb-1">Contrarian Wins</div>
				<div className="text-xl font-bold">{trader.contrarian_wins}</div>
			</div>
			<div>
				<div className="text-xs text-muted-foreground mb-1">Total Profit</div>
				<div className="text-xl font-bold text-green-600">${trader.profit.toFixed(0)}</div>
			</div>
			<div>
				<div className="text-xs text-muted-foreground mb-1">ROI</div>
				<div className="text-lg font-semibold text-green-600">
					{trader.roi_percent.toFixed(0)}%
				</div>
			</div>
			<div>
				<div className="text-xs text-muted-foreground mb-1">Best Entry</div>
				<div className="text-lg font-semibold">
					{(trader.best_entry_price * 100).toFixed(2)}%
				</div>
			</div>
		</div>
	);
}
