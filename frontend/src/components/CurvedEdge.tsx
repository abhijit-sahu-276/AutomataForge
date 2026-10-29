import React from 'react';
import { EdgeProps, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

/**
 * Custom curved edge component supporting:
 * - Direct quadratic control points (for long return routes around the outside of the graph)
 * - Perpendicular offset curvature (for bidirectional edge pairs to prevent overlapping)
 * - Standard smooth bezier paths for simple connections
 * - High-contrast styling with solid base path and subtle directional active animation
 * - Clearly readable badge labels with dark background and border to avoid line overlap
 */
export const CurvedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  data,
}) => {
  const isActive = Boolean(data?.__active);
  const stroke = isActive ? '#22D3EE' : '#38BDF8';
  const strokeWidth = isActive ? 3.5 : 2.5;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  const controlX = data?.__controlX as number | undefined;
  const controlY = data?.__controlY as number | undefined;
  const curveOffset = data?.__curveOffset as number | undefined;

  if (controlX !== undefined && controlY !== undefined) {
    // Explicit quadratic control point (e.g. outer perimeter routing)
    edgePath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
    // Midpoint of quadratic bezier curve at t = 0.5
    labelX = 0.25 * sourceX + 0.5 * controlX + 0.25 * targetX;
    labelY = 0.25 * sourceY + 0.5 * controlY + 0.25 * targetY;
  } else if (curveOffset !== undefined && curveOffset !== 0) {
    // Perpendicular offset for bidirectional separation
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normal vector perpendicular to direction of travel (pointing to the right of travel)
    const nx = dy / len;
    const ny = -dx / len;

    const midX = (sourceX + targetX) / 2 + nx * curveOffset;
    const midY = (sourceY + targetY) / 2 + ny * curveOffset;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    // Curve apex at t = 0.5
    labelX = 0.25 * sourceX + 0.5 * midX + 0.25 * targetX;
    labelY = 0.25 * sourceY + 0.5 * midY + 0.25 * targetY;
  } else {
    // Standard smooth bezier for un-curved edges
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  return (
    <>
      {/* Solid background stroke — always visible */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{
          filter: isActive ? 'drop-shadow(0 0 5px rgba(34, 211, 238, 0.7))' : undefined,
        }}
      />
      {/* Directional traveling highlight overlay when active */}
      {isActive && (
        <path
          d={edgePath}
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
