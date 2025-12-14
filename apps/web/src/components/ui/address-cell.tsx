import { cn } from '@/lib/utils';

interface AddressCellProps {
	address: string;
	className?: string;
}

export function AddressCell({ address, className }: AddressCellProps) {
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(address);
			// Optional: Show a toast notification
			alert('Address copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	};

	const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

	return (
		<button
			onClick={handleCopy}
			className={cn(
				'font-mono text-xs hover:text-blue-600 hover:underline cursor-pointer transition-colors',
				className
			)}
			title={`Click to copy: ${address}`}
		>
			{shortAddress}
		</button>
	);
}
