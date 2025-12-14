import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CategoryFlowData {
	from: string;
	to: string;
	value: number;
}

const categoryColors: Record<string, string> = {
	Politics: '#ef4444',
	Crypto: '#f59e0b',
	Science: '#10b981',
	Sports: '#3b82f6',
	Entertainment: '#8b5cf6',
};

export function CategoryFlowDiagram() {
	const [data, setData] = useState<CategoryFlowData[]>([]);
	const [loading, setLoading] = useState(true);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response = await fetch(`${API_URL}/api/flow/categories`);
				const result = await response.json();
				setData(result.data || []);
			} catch (error) {
				console.error('Failed to fetch category flow:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		if (data.length === 0) return;

		const categories = new Set<string>();
		data.forEach((flow) => {
			categories.add(flow.from);
			categories.add(flow.to);
		});

		const categoryArray = Array.from(categories);
		const newNodes: Node[] = categoryArray.map((category, index) => ({
			id: category,
			type: 'default',
			position: {
				x: 100 + (index % 3) * 300,
				y: 100 + Math.floor(index / 3) * 200,
			},
			data: { label: category },
			style: {
				background: categoryColors[category] || '#6b7280',
				color: '#fff',
				padding: '20px',
				borderRadius: '8px',
				fontSize: '16px',
				fontWeight: 'bold',
				minWidth: '150px',
				textAlign: 'center',
			},
		}));

		const newEdges: Edge[] = data.map((flow, index) => ({
			id: `e${index}`,
			source: flow.from,
			target: flow.to,
			label: `${flow.value} transitions`,
			animated: true,
			style: {
				strokeWidth: Math.min(10, Math.max(2, flow.value / 2)),
				stroke: '#64748b',
			},
			type: 'smoothstep',
		}));

		setNodes(newNodes);
		setEdges(newEdges);
	}, [data, setNodes, setEdges]);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading category flow...</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>🔄 Category Flow Diagram</CardTitle>
				<CardDescription>
					How traders move between market categories ({data.length} transitions detected)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="mb-4 p-4 bg-muted/50 rounded-lg text-sm space-y-2">
					<p className="font-medium">📖 How to read this:</p>
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						<li>
							<strong>Nodes (boxes)</strong>: Each represents a market category
							(Politics, Crypto, Sports, etc.)
						</li>
						<li>
							<strong>Arrows (connections)</strong>: Show the direction traders moved
							between categories
						</li>
						<li>
							<strong>Arrow thickness</strong>: Thicker = more traders made this
							transition
						</li>
						<li>
							<strong>Example</strong>: If Politics → Crypto is thick, many traders
							started in Politics then traded in Crypto markets
						</li>
						<li>
							<strong>Criteria</strong>: Traders who made trades in different
							categories at different times (minimum 2 traders per transition)
						</li>
					</ul>
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
					</ReactFlow>
				</div>
			</CardContent>
		</Card>
	);
}
