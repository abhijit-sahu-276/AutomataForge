import React from 'react';
import { EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

/**
 * Custom edge component that renders a visible self-loop arc above a node.
 * Draws a cubic bezier loop protruding from the top of the node circle.
 */
export const SelfLoopEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  label,
  markerEnd,
  data,
}) => {
  const loopRadius = 38;
  const loopHeight = 52;

  // The node circle center is at (sourceX, sourceY + 32).
  // The loop starts at (sourceX - 14, sourceY) and ends at (sourceX + 14, sourceY).
  // Control points curve up and wide, then come down angled toward the circle center.
  const path = `
    M ${sourceX - 14} ${sourceY}
    C ${sourceX - loopRadius} ${sourceY - loopHeight},
      ${sourceX + loopRadius} ${sourceY - loopHeight},
      ${sourceX + 14} ${sourceY}
  `;

  const labelX = sourceX;
  const labelY = sourceY - loopHeight - 12;

  const isActive = Boolean(data?.__active);
  const stroke = isActive ? '#22D3EE' : '#38BDF8';
  const strokeWidth = isActive ? 3.5 : 2.5;

  return (
    <>
      {/* Solid background stroke — always visible */}
      <path
        id={id}
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{
          filter: isActive ? 'drop-shadow(0 0 5px rgba(34, 211, 238, 0.7))' : undefined,
        }}
      />
      {/* Animated traveling highlight overlay when active */}
      {isActive && (
        <path
          d={path}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeDasharray="8 12"
          className="edge-flow-animation"
        />
      )}
      {/* Label Badge */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan react-flow__edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: isActive ? '#083344' : '#0B0F19',
                border: isActive ? '1.5px solid #22D3EE' : '1px solid #0284C7',
                boxShadow: isActive
                  ? '0 0 10px rgba(34, 211, 238, 0.5)'
                  : '0 2px 6px rgba(0, 0, 0, 0.7)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: isActive ? '#A5F3FC' : '#E0F2FE',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em',
                }}
              >
                {label}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
