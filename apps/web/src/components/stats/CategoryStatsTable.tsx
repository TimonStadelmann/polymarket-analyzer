import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SuccessRateBadge } from './SuccessRateBadge';

interface CategoryStat {
	category: string;
	total_contrarian_bets: number;
	winning_bets: number;
	success_rate: number;
	winning_volume: number;
	total_volume: number;
	avg_entry_price: number;
}

interface CategoryStatsTableProps {
	stats: CategoryStat[];
}

export function CategoryStatsTable({ stats }: CategoryStatsTableProps) {
	if (stats.length === 0) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				No category statistics found
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Category</TableHead>
					<TableHead className="text-right">Total Bets</TableHead>
					<TableHead className="text-right">Winning Bets</TableHead>
					<TableHead className="text-right">Success Rate</TableHead>
					<TableHead className="text-right">Avg Entry Price</TableHead>
					<TableHead className="text-right">Total Volume</TableHead>
					<TableHead className="text-right">Winning Volume</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{stats.map((stat) => (
					<TableRow key={stat.category}>
						<TableCell>
							<Badge variant="secondary">{stat.category}</Badge>
						</TableCell>
						<TableCell className="text-right font-mono">
							{stat.total_contrarian_bets}
						</TableCell>
						<TableCell className="text-right font-mono">{stat.winning_bets}</TableCell>
						<TableCell className="text-right">
							<SuccessRateBadge rate={stat.success_rate} />
						</TableCell>
						<TableCell className="text-right font-mono text-sm">
							{(stat.avg_entry_price * 100).toFixed(2)}%
						</TableCell>
						<TableCell className="text-right font-mono text-sm">
							${stat.total_volume.toFixed(2)}
						</TableCell>
						<TableCell className="text-right font-mono text-sm">
							${stat.winning_volume.toFixed(2)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
