import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MarketCorrelationData {
	market1: {
		id: string;
		question: string;
		slug: string;
		category: string;
	};
	market2: {
		id: string;
		question: string;
		slug: string;
		category: string;
	};
	shared_traders: number;
}

const categoryColors: Record<string, string> = {
	Politics: '#ef4444',
	Crypto: '#f59e0b',
	Science: '#10b981',
	Sports: '#3b82f6',
	Entertainment: '#8b5cf6',
	Unknown: '#6b7280',
};

export function MarketCorrelationGraph() {
	const [data, setData] = useState<MarketCorrelationData[]>([]);
	const [loading, setLoading] = useState(true);
	const [minShared, setMinShared] = useState(3);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`${API_URL}/api/network/markets?minShared=${minShared}&limit=50`
			);
			const result = await response.json();
			setData(result.data || []);
		} catch (error) {
			console.error('Failed to fetch market correlation:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (data.length === 0) return;

		const marketMap = new Map<string, any>();
		data.forEach((link) => {
			if (!marketMap.has(link.market1.id)) {
				marketMap.set(link.market1.id, link.market1);
			}
			if (!marketMap.has(link.market2.id)) {
				marketMap.set(link.market2.id, link.market2);
			}
		});

		const newNodes: Node[] = Array.from(marketMap.entries()).map(([id, market], index) => ({
			id,
			type: 'default',
			position: {
				x: Math.cos((index / marketMap.size) * 2 * Math.PI) * 350 + 450,
				y: Math.sin((index / marketMap.size) * 2 * Math.PI) * 350 + 350,
			},
			data: {
				label: market.question.substring(0, 40) + '...',
			},
			style: {
				background: categoryColors[market.category] || categoryColors.Unknown,
				color: '#fff',
				padding: '10px',
				borderRadius: '8px',
				fontSize: '11px',
				maxWidth: '180px',
			},
		}));

		const newEdges: Edge[] = data.map((link, index) => ({
			id: `e${index}`,
			source: link.market1.id,
			target: link.market2.id,
			label: `${link.shared_traders} traders`,
			style: {
				strokeWidth: Math.min(25, 2 + (link.shared_traders - 10) * 2),
				stroke: '#94a3b8',
			},
		}));

		setNodes(newNodes);
		setEdges(newEdges);
	}, [data, setNodes, setEdges]);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading market correlation...</p>
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
							<Label>Min Shared Traders: {minShared}</Label>
							<Input
								type="number"
								value={minShared}
								onChange={(e) => setMinShared(Number(e.target.value))}
								min={1}
								max={20}
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
					<CardTitle>🎯 Market Correlation Network</CardTitle>
					<CardDescription>
						Markets connected by shared traders (found {nodes.length} markets,{' '}
						{edges.length} connections)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 p-4 bg-muted/50 rounded-lg text-sm space-y-2">
						<p className="font-medium">📖 How to read this:</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground">
							<li>
								<strong>Nodes (boxes)</strong>: Each represents a prediction market
							</li>
							<li>
								<strong>Node colors</strong>: Different categories (Politics 🔴,
								Crypto 🟠, Science 🟢, Sports 🔵, etc.)
							</li>
							<li>
								<strong>Connections (lines)</strong>: Markets are connected if many
								traders participated in both
							</li>
							<li>
								<strong>Line thickness</strong>: Thicker = more traders in common
							</li>
							<li>
								<strong>Use case</strong>: Find related markets that traders
								consider similar or complementary
							</li>
						</ul>
						<p className="text-muted-foreground mt-2">
							<strong>Filter:</strong> Only showing markets with at least {minShared}{' '}
							shared traders.
						</p>
					</div>
					<div style={{ height: '600px' }}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
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
