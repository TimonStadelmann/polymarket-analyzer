import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TraderNetworkData {
	trader1: {
		address: string;
		name: string | null;
		pseudonym: string | null;
		image: string | null;
		trades: number;
	};
	trader2: {
		address: string;
		name: string | null;
		pseudonym: string | null;
		image: string | null;
		trades: number;
	};
	shared_markets: number;
}

export function TraderNetworkGraph() {
	const [data, setData] = useState<TraderNetworkData[]>([]);
	const [loading, setLoading] = useState(true);
	const [minShared, setMinShared] = useState(2);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`${API_URL}/api/network/traders?minShared=${minShared}&limit=50`
			);
			const result = await response.json();
			setData(result.data || []);
		} catch (error) {
			console.error('Failed to fetch trader network:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (data.length === 0) return;

		const traderMap = new Map<string, any>();
		data.forEach((link) => {
			if (!traderMap.has(link.trader1.address)) {
				traderMap.set(link.trader1.address, link.trader1);
			}
			if (!traderMap.has(link.trader2.address)) {
				traderMap.set(link.trader2.address, link.trader2);
			}
		});

		const newNodes: any[] = Array.from(traderMap.entries()).map(([address, trader], index) => ({
			id: address,
			type: 'default',
			position: {
				x: Math.cos((index / traderMap.size) * 2 * Math.PI) * 300 + 400,
				y: Math.sin((index / traderMap.size) * 2 * Math.PI) * 300 + 300,
			},
			data: {
				label: trader.name || trader.pseudonym || address.substring(0, 8) + '...',
				address: address,
			},
			style: {
				width: Math.min(150, 50 + trader.trades * 2),
				height: Math.min(150, 50 + trader.trades * 2),
				background: '#3b82f6',
				color: '#fff',
				borderRadius: '50%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '12px',
				fontWeight: 'bold',
				cursor: 'pointer',
			},
		}));

		const newEdges: any[] = data.map((link, index) => ({
			id: `e${index}`,
			source: link.trader1.address,
			target: link.trader2.address,
			label: `${link.shared_markets} markets`,
			animated: true,
			style: {
				strokeWidth: Math.min(20, 2 + (link.shared_markets - 3) * 2.5),
				stroke: '#6366f1',
			},
		}));

		setNodes(newNodes);
		setEdges(newEdges);
	}, [data, setNodes, setEdges]);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading trader network...</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center gap-4">
						<div className="w-64">
							<Label>Min Shared Markets: {minShared}</Label>
							<Input
								type="number"
								value={minShared}
								onChange={(e) => setMinShared(Number(e.target.value))}
								min={1}
								max={10}
							/>
						</div>
						<button
							onClick={fetchData}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							Apply
						</button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>🔗 Trader Network</CardTitle>
					<CardDescription>
						Connections between traders who trade on similar markets (found{' '}
						{nodes.length} traders, {edges.length} connections)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 p-4 bg-muted/50 rounded-lg text-sm space-y-2">
						<p className="font-medium">📖 How to read this:</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground">
							<li>
								<strong>Nodes (circles)</strong>: Each represents a trader
							</li>
							<li>
								<strong>Circle size</strong>: Larger circles = more trades made by
								that trader
							</li>
							<li>
								<strong>Connections (lines)</strong>: Two traders are connected if
								they traded on the same markets
							</li>
							<li>
								<strong>Line thickness</strong>: Thicker = more markets in common
							</li>
							<li>
								<strong>Clusters</strong>: Groups of closely connected traders
								indicate similar trading interests
							</li>
						</ul>
						<p className="text-muted-foreground mt-2">
							<strong>Filter:</strong> Only showing traders with at least {minShared}{' '}
							shared markets.
						</p>
					</div>
					<div style={{ height: '600px' }}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onNodeClick={(_event, node) => {
								const address = node.data.address;
								if (address) {
									window.open(
										`https://polymarket.com/profile/@${address}`,
										'_blank'
									);
								}
							}}
							fitView
						>
							<Background />
							<Controls />
							<MiniMap />
						</ReactFlow>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
