export interface ContrarianTrade {
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

export interface LeaderboardResponse {
	success: boolean;
	count: number;
	data: ContrarianTrade[];
}
