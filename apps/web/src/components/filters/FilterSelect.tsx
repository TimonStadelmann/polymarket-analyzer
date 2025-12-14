import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FilterSelectProps {
	label: string;
	value: string | number;
	onChange: (value: string) => void;
	options: Array<{ value: string | number; label: string }>;
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Select value={String(value)} onChange={(e) => onChange(e.target.value)}>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
		</div>
	);
}
