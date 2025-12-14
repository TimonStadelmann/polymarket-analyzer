import { Badge } from '@/components/ui/badge';

interface RankBadgeProps {
	rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
	if (rank === 0) return <span className="text-2xl">🥇</span>;
	if (rank === 1) return <span className="text-2xl">🥈</span>;
	if (rank === 2) return <span className="text-2xl">🥉</span>;
	return <span className="font-mono text-sm">#{rank + 1}</span>;
}
