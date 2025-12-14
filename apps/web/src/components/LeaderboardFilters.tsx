import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FilterInput } from './filters/FilterInput';
import { FilterSelect } from './filters/FilterSelect';

interface FilterProps {
	onFilterChange: (filters: FilterValues) => void;
	categories: string[];
}

export interface FilterValues {
	limit: number;
	category: string;
	minRoi: number;
	maxEntryPrice: number;
}

export function LeaderboardFilters({ onFilterChange, categories }: FilterProps) {
	const [limit, setLimit] = useState(20);
	const [category, setCategory] = useState('All');
	const [minRoi, setMinRoi] = useState(0);
	const [maxEntryPrice, setMaxEntryPrice] = useState(20);

	const handleApply = () => {
		onFilterChange({
			limit,
			category,
			minRoi,
			maxEntryPrice: maxEntryPrice / 100,
		});
	};

	const limitOptions = [
		{ value: 10, label: '10 results' },
		{ value: 20, label: '20 results' },
		{ value: 50, label: '50 results' },
		{ value: 100, label: '100 results' },
	];

	const categoryOptions = [
		{ value: 'All', label: 'All Categories' },
		...categories.map((cat) => ({ value: cat, label: cat })),
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Filter Options</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<FilterSelect
						label="Results Limit"
						value={limit}
						onChange={(val) => setLimit(Number(val))}
						options={limitOptions}
					/>

					<FilterSelect
						label="Category"
						value={category}
						onChange={setCategory}
						options={categoryOptions}
					/>

					<FilterInput
						label="Min ROI"
						value={minRoi}
						onChange={setMinRoi}
						min={0}
						max={10000}
						step={100}
					/>

					<FilterInput
						label="Max Entry Price"
						value={maxEntryPrice}
						onChange={setMaxEntryPrice}
						min={1}
						max={100}
						step={1}
					/>
				</div>

				<Button onClick={handleApply}>Apply Filters</Button>
			</CardContent>
		</Card>
	);
}
