import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ContrarianLeaderboard } from './components/ContrarianLeaderboard';
import { CategoryStats } from './components/CategoryStats';
import { TopTraders } from './components/TopTraders';
import { TraderNetworkGraph } from './components/visualizations/TraderNetworkGraph';
import { MarketCorrelationGraph } from './components/visualizations/MarketCorrelationGraph';
import { CategoryFlowDiagram } from './components/visualizations/CategoryFlowDiagram';
import { PageLayout } from './components/layout/PageLayout';

function App() {
	return (
		<BrowserRouter>
			<PageLayout>
				<Routes>
					<Route path="/" element={<ContrarianLeaderboard />} />
					<Route path="/stats" element={<CategoryStats />} />
					<Route path="/traders" element={<TopTraders />} />
					<Route path="/viz/trader-network" element={<TraderNetworkGraph />} />
					<Route path="/viz/market-correlation" element={<MarketCorrelationGraph />} />
					<Route path="/viz/category-flow" element={<CategoryFlowDiagram />} />
				</Routes>
			</PageLayout>
		</BrowserRouter>
	);
}

export default App;
