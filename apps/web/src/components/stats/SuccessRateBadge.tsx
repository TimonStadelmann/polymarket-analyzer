interface SuccessRateBadgeProps {
	rate: number;
}

export function SuccessRateBadge({ rate }: SuccessRateBadgeProps) {
	const getColor = () => {
		if (rate > 5) return 'text-green-600';
		if (rate > 2) return 'text-yellow-600';
		return 'text-red-600';
	};

	return <span className={`font-semibold ${getColor()}`}>{rate.toFixed(1)}%</span>;
}
