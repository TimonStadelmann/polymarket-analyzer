import { NavLink } from './NavLink';
import { useState, useEffect, useRef } from 'react';

export function Navigation() {
	const [showVizMenu, setShowVizMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowVizMenu(false);
			}
		}

		if (showVizMenu) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [showVizMenu]);

	return (
		<nav className="flex gap-2 mt-4">
			<NavLink to="/">📊 Top Trades</NavLink>
			<NavLink to="/stats">📈 Category Stats</NavLink>
			<NavLink to="/traders">🎖️ Top Traders</NavLink>

			<div className="relative" ref={menuRef}>
				<button
					onClick={() => setShowVizMenu(!showVizMenu)}
					className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
				>
					🎨 Visualizations ▾
				</button>
				{showVizMenu && (
					<div className="absolute top-full mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[220px]">
						<NavLink
							to="/viz/trader-network"
							onClick={() => setShowVizMenu(false)}
							dropdown
						>
							🔗 Trader Network
						</NavLink>
						<NavLink
							to="/viz/market-correlation"
							onClick={() => setShowVizMenu(false)}
							dropdown
						>
							🔗 Market Correlation
						</NavLink>
						<NavLink
							to="/viz/category-flow"
							onClick={() => setShowVizMenu(false)}
							dropdown
						>
							🔄 Category Flow
						</NavLink>
					</div>
				)}
			</div>
		</nav>
	);
}
