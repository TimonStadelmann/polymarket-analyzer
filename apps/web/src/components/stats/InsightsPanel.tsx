import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InsightsPanel() {
	return (
		<Card className="mt-6 bg-muted/50">
			<CardHeader>
				<CardTitle className="text-sm">💡 Insights</CardTitle>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground space-y-2">
				<ul className="list-disc pl-5 space-y-1">
					<li>Success Rate: Percentage of contrarian bets that won</li>
					<li>Avg Entry Price: Average price at which contrarian traders entered</li>
					<li>Lower entry prices typically indicate higher potential ROI</li>
					<li>
						Green = High success rate (&gt;5%), Yellow = Medium (2-5%), Red = Low
						(&lt;2%)
					</li>
				</ul>
			</CardContent>
		</Card>
	);
}
