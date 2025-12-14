const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface FilterValues {
	limit: number;
	category: string;
	minRoi: number;
	maxEntryPrice: number;
}

export async function fetchContrariansLeaderboard(filters: FilterValues): Promise<any> {
	const params = new URLSearchParams({
		limit: filters.limit.toString(),
		minRoi: filters.minRoi.toString(),
		maxEntryPrice: filters.maxEntryPrice.toString(),
	});

	if (filters.category && filters.category !== 'All') {
		params.append('category', filters.category);
	}

	const response = await fetch(`${API_BASE}/api/contrarians/leaderboard?${params.toString()}`);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function fetchCategories(): Promise<any> {
	const response = await fetch(`${API_BASE}/api/contrarians/categories`);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function fetchSuccessRateByCategory(maxEntryPrice: number = 0.2): Promise<any> {
	const response = await fetch(
		`${API_BASE}/api/contrarians/success-rate?maxEntryPrice=${maxEntryPrice}`
	);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function fetchTopContrarianTraders(
	limit: number = 20,
	minWins: number = 2,
	maxEntryPrice: number = 0.2
): Promise<any> {
	const params = new URLSearchParams({
		limit: limit.toString(),
		minWins: minWins.toString(),
		maxEntryPrice: maxEntryPrice.toString(),
	});

	const response = await fetch(`${API_BASE}/api/contrarians/top-traders?${params.toString()}`);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function fetchDatabaseStats(): Promise<any> {
	const response = await fetch(`${API_BASE}/api/stats/database`);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}
