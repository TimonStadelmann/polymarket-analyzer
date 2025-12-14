import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileLink } from '@/components/ui/profile-link';
import { AddressCell } from '@/components/ui/address-cell';

interface TraderCellProps {
	image: string | null;
	name: string | null;
	pseudonym: string | null;
	address: string;
}

export function TraderCell({ image, name, pseudonym, address }: TraderCellProps) {
	const displayName = name || pseudonym;
	const initials = (displayName || address)
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="flex items-center gap-2">
			<Avatar className="h-6 w-6">
				{image && <AvatarImage src={image} alt={displayName || address} />}
				<AvatarFallback className="text-xs">{initials}</AvatarFallback>
			</Avatar>
			<div className="flex flex-col gap-0.5">
				{displayName ? (
					<>
						<ProfileLink username={name || pseudonym} address={address}>
							<span className="font-medium">{displayName}</span>
						</ProfileLink>
						<AddressCell address={address} className="text-xs text-muted-foreground" />
					</>
				) : (
					<AddressCell address={address} />
				)}
			</div>
		</div>
	);
}
