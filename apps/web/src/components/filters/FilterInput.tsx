import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FilterInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

export function FilterInput({ label, value, onChange, min, max, step }: FilterInputProps) {
	return (
		<div className="space-y-2">
			<Label>
				{label}: {value}
				{label.includes('Price') ? '%' : label.includes('ROI') ? '%' : ''}
			</Label>
			<Input
				type="number"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
}
