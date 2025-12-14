import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps {
	to: string;
	children: React.ReactNode;
	onClick?: () => void;
	dropdown?: boolean;
}

export function NavLink({ to, children, onClick, dropdown = false }: NavLinkProps) {
	const location = useLocation();
	const isActive = location.pathname === to;

	if (dropdown) {
		return (
			<Link
				to={to}
				onClick={onClick}
				className={cn(
					'block px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
					isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
				)}
			>
				{children}
			</Link>
		);
	}

	return (
		<Link
			to={to}
			onClick={onClick}
			className={cn(
				'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
				isActive
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
			)}
		>
			{children}
		</Link>
	);
}
