import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RankBadge } from './RankBadge';
import { TraderCell } from './TraderCell';
import { MarketQuestionCell } from './MarketQuestionCell';

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

interface LeaderboardTableProps {
	trades: ContrarianTrade[];
}

export function LeaderboardTable({ trades }: LeaderboardTableProps) {
	if (trades.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				No contrarian trades found
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-16">Rank</TableHead>
					<TableHead>Trader</TableHead>
					<TableHead>Market</TableHead>
					<TableHead>Outcome</TableHead>
					<TableHead className="text-right">Entry Price</TableHead>
					<TableHead className="text-right">Investment</TableHead>
					<TableHead className="text-right">ROI</TableHead>
					<TableHead>Category</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{trades.map((trade, idx) => (
					<TableRow key={trade.tx_hash}>
						<TableCell>
							<RankBadge rank={idx} />
						</TableCell>
						<TableCell>
							<TraderCell
								image={trade.trader_image}
								name={trade.trader_name}
								pseudonym={trade.trader_pseudonym}
								address={trade.trader_address}
							/>
						</TableCell>
						<TableCell>
							<MarketQuestionCell question={trade.market_question} />
						</TableCell>
						<TableCell>
							<Badge variant="outline">{trade.outcome}</Badge>
						</TableCell>
						<TableCell className="text-right font-mono">
							{(trade.entry_price * 100).toFixed(2)}%
						</TableCell>
						<TableCell className="text-right font-mono">
							${trade.investment_usd.toFixed(2)}
						</TableCell>
						<TableCell className="text-right">
							<span className="font-bold text-green-600">
								{trade.roi_percent.toFixed(0)}%
							</span>
						</TableCell>
						<TableCell>
							<Badge variant="secondary">{trade.category}</Badge>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
