interface ProfileLinkProps {
	username?: string | null;
	address: string;
	children?: React.ReactNode;
}

export function ProfileLink({ username, address, children }: ProfileLinkProps) {
	const profileUrl = username
		? `https://polymarket.com/@${username}`
		: `https://polymarket.com/profile/${address}`;

	return (
		<a
			href={profileUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="hover:text-blue-600 hover:underline transition-colors"
			title={`View profile on Polymarket`}
		>
			{children || username || address}
		</a>
	);
}
