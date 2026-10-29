import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { DfaNode } from './DfaNode';
import { SelfLoopEdge } from './SelfLoopEdge';
import { CurvedEdge } from './CurvedEdge';
import { DFAModel } from '../types/dfa';

interface DfaGraphProps {
  dfa: DFAModel;
  activeState?: string | null;
  highlightDifferState?: string | null;
  height?: string;
  readOnly?: boolean;
}

const nodeTypes = {
  dfaNode: DfaNode,
};

const edgeTypes = {
  selfLoop: SelfLoopEdge,
  curvedEdge: CurvedEdge,
};

/** Bidirectional offset distance in pixels */
const BIDI_OFFSET = 42;

export const DfaGraph: React.FC<DfaGraphProps> = ({
  dfa,
  activeState,
  highlightDifferState,
  height = '400px',
}) => {
  // Compute circular layout positions & edges
  const { nodes, edges } = useMemo(() => {
    const stateList = dfa.states;
    const n = stateList.length;
    const radius = Math.max(140, n * 35);
    const centerX = radius + 60;
    const centerY = radius + 40;

    const generatedNodes: Node[] = stateList.map((state, i) => {
      const angle = (2 * Math.PI * i) / (n || 1) - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: state,
        type: 'dfaNode',
        position: { x, y },
        data: {
          label: state,
          isStart: state === dfa.start_state,
          isAccept: dfa.accept_states.includes(state),
          isActive: state === activeState,
          isHighlightDiffer: state === highlightDifferState,
        },
      };
    });

    // Group transitions by (source, target) to merge symbols like "0, 1"
    const edgeMap: Record<string, { source: string; target: string; symbols: string[] }> = {};

    for (const [src, symMap] of Object.entries(dfa.transitions)) {
      for (const [sym, dst] of Object.entries(symMap)) {
        const key = `${src}->${dst}`;
        if (!edgeMap[key]) {
          edgeMap[key] = { source: src, target: dst, symbols: [] };
        }
        if (!edgeMap[key].symbols.includes(sym)) {
          edgeMap[key].symbols.push(sym);
        }
      }
    }

    // Detect bidirectional pairs: does both A->B and B->A exist?
    const bidirectionalKeys = new Set<string>();
    for (const key of Object.keys(edgeMap)) {
      const { source, target } = edgeMap[key];
      if (source !== target) {
        const reverseKey = `${target}->${source}`;
        if (edgeMap[reverseKey]) {
          bidirectionalKeys.add(key);
        }
      }
    }

    // Node center positions (64x64 node size, center is +32, +32)
    const nodeCenters: Record<string, { x: number; y: number }> = {};
    generatedNodes.forEach((node) => {
      nodeCenters[node.id] = {
        x: node.position.x + 32,
        y: node.position.y + 32,
      };
    });

    const generatedEdges: Edge[] = Object.entries(edgeMap).map(([key, data], idx) => {
      const isSelfLoop = data.source === data.target;
      const label = data.symbols.sort().join(', ');
      const isActive = data.source === activeState;

      const strokeColor = isActive ? '#22D3EE' : '#38BDF8';

      const markerEnd = {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 22,
        height: 22,
      };

      if (isSelfLoop) {
        // Self-loop renders as a visible arc above the node circle
        return {
          id: `e-${key}-${idx}`,
          source: data.source,
          target: data.target,
          sourceHandle: 'top-out',
          targetHandle: 'top-in',
          label,
          type: 'selfLoop',
          animated: false,
          data: { __active: isActive },
          markerEnd,
        };
      }

      const srcCenter = nodeCenters[data.source] || { x: 0, y: 0 };
      const tgtCenter = nodeCenters[data.target] || { x: 0, y: 0 };
      const dx = tgtCenter.x - srcCenter.x;
      const dy = tgtCenter.y - srcCenter.y;

      const isBidirectional = bidirectionalKeys.has(key);

      let sourceHandle: string;
      let targetHandle: string;
      let edgeData: Record<string, unknown> = { __active: isActive };

      if (isBidirectional) {
        // For bidirectional pairs, assign opposite handle pairs and perpendicular curvature
        // so A->B and B->A curve in opposite directions with distinct routing lanes
        if (Math.abs(dx) >= Math.abs(dy)) {
          // Mostly horizontal connection
          if (dx > 0) {
            // Forward (left to right): use bottom handles and curve downwards
            sourceHandle = 'bottom-out';
            targetHandle = 'bottom-in';
          } else {
            // Reverse (right to left): use top handles and curve upwards
            sourceHandle = 'top-out';
            targetHandle = 'top-in';
          }
        } else {
          // Mostly vertical connection
          if (dy > 0) {
            // Downward: use right handles and curve rightwards
            sourceHandle = 'right-out';
            targetHandle = 'right-in';
          } else {
            // Upward: use left handles and curve leftwards
            sourceHandle = 'left-out';
            targetHandle = 'left-in';
          }
        }
        edgeData.__curveOffset = BIDI_OFFSET;
      } else {
        // Non-bidirectional connection: pick facing handles
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx > 0) {
            sourceHandle = 'right-out';
            targetHandle = 'left-in';
          } else {
            sourceHandle = 'left-out';
            targetHandle = 'right-in';
          }
        } else {
          if (dy > 0) {
            sourceHandle = 'bottom-out';
            targetHandle = 'top-in';
          } else {
            sourceHandle = 'top-out';
            targetHandle = 'bottom-in';
          }
        }

        // Check if edge passes near graph center (e.g. return edge across diameter)
        const lineLen = Math.sqrt(dx * dx + dy * dy) || 1;
        if (lineLen > 110) {
          const t = ((centerX - srcCenter.x) * dx + (centerY - srcCenter.y) * dy) / (lineLen * lineLen);
          const tClamped = Math.max(0, Math.min(1, t));
          const closeX = srcCenter.x + tClamped * dx;
          const closeY = srcCenter.y + tClamped * dy;
          const distToCenter = Math.sqrt((closeX - centerX) ** 2 + (closeY - centerY) ** 2);

          if (distToCenter < 50) {
            // Edge crosses close to center: route outward around perimeter
            let outX = closeX - centerX;
            let outY = closeY - centerY;
            const outLen = Math.sqrt(outX * outX + outY * outY);
            if (outLen < 1) {
              outX = dy;
              outY = -dx;
            }
            const norm = Math.sqrt(outX * outX + outY * outY) || 1;
            const controlDist = radius + 65;
            edgeData.__controlX = centerX + (outX / norm) * controlDist;
            edgeData.__controlY = centerY + (outY / norm) * controlDist;
          }
        }
      }

      return {
        id: `e-${key}-${idx}`,
        source: data.source,
        target: data.target,
        sourceHandle,
        targetHandle,
        label,
        type: 'curvedEdge',
        animated: false,
        data: edgeData,
        markerEnd,
      };
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [dfa, activeState, highlightDifferState]);

  return (
    <div
      style={{ height }}
      className="w-full bg-[#0D121F] rounded-xl border border-slate-800 relative overflow-hidden shadow-inner"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden fill-slate-300"
        />
      </ReactFlow>

      {/* State Count Pill */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 px-2.5 py-1 rounded-md text-xs font-mono text-slate-400">
        States: <span className="text-indigo-400 font-semibold">{dfa.states.length}</span> | Alphabet:{' '}
        <span className="text-cyan-400 font-semibold">{`{${dfa.alphabet.join(', ')}}`}</span>
      </div>
    </div>
  );
};
