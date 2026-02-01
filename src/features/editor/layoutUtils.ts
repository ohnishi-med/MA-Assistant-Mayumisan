import dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const nodeWidth = 160;
const nodeHeight = 40;

export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    direction = 'LR',
    options: { nodesep?: number; ranksep?: number } = {}
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: options.nodesep ?? 30,  // ノード同士の間隔
        ranksep: options.ranksep ?? 80,  // 階層同士の間隔
        marginx: 50,
        marginy: 50,
    });

    nodes.forEach((node) => {
        // ノードの実際のサイズ（もしあれば）またはデフォルト値を使用
        // React Flowのノードはデフォルトで中央基準
        dagreGraph.setNode(node.id, {
            width: nodeWidth,
            height: nodeHeight
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return {
            ...node,
            position,
            // 接続口の位置をレイアウト方向に合わせる
            sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
            targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        };
    });

    return { nodes: newNodes, edges };
};
