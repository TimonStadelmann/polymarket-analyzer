import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TraderFilterProps {
	minWins: number;
	onMinWinsChange: (value: number) => void;
	onApply: () => void;
}

export function TraderFilter({ minWins, onMinWinsChange, onApply }: TraderFilterProps) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="space-y-2">
					<Label>Minimum Contrarian Wins:</Label>
					<div className="flex gap-2 items-center">
						<Input
							type="number"
							value={minWins}
							onChange={(e) => onMinWinsChange(Number(e.target.value))}
							min={1}
							max={10}
							className="w-20"
						/>
						<Button onClick={onApply} size="sm">
							Apply
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
