interface MarketQuestionCellProps {
	question: string;
}

export function MarketQuestionCell({ question }: MarketQuestionCellProps) {
	return (
		<div className="max-w-sm truncate" title={question}>
			{question}
		</div>
	);
}
