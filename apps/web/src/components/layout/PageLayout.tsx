import { Navigation } from './Navigation';
import { DatabaseStats } from '../header/DatabaseStats';

interface PageLayoutProps {
	children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-start justify-between gap-4 mb-4">
						<div className="flex-1">
							<h1 className="text-4xl font-bold mb-2">
								Polymarket Contrarian Finder
							</h1>
							<p className="text-sm text-gray-600">
								Discover contrarian trades - buying winning outcomes when others
								doubted
							</p>
						</div>
						<DatabaseStats />
					</div>
					<Navigation />
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">{children}</main>

			<footer className="mt-12 border-t bg-white">
				<div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
					Built with React, Fastify, and Neo4j | Data from Polymarket
				</div>
			</footer>
		</div>
	);
}
