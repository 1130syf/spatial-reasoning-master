import React, { useRef, useEffect, useLayoutEffect } from 'react';
import './DiagramOverlay.css';

// Define a standard layout for the skeleton diagram within a 200x300 viewBox
// Coordinates adjusted for a more natural, slightly relaxed standing pose.
export const SKELETON_LAYOUT = {
  // Head (simplified to only nose and ears for general head position)
  nose: { x: 100, y: 30 },
  left_ear: { x: 80, y: 30 }, right_ear: { x: 120, y: 30 },

  // Torso
  left_shoulder: { x: 75, y: 60 }, right_shoulder: { x: 125, y: 60 },
  left_hip: { x: 85, y: 130 }, right_hip: { x: 115, y: 130 },
  mid_hip: { x: 100, y: 130 },

  // Arms
  left_elbow: { x: 65, y: 95 }, right_elbow: { x: 135, y: 95 },
  left_wrist: { x: 60, y: 125 }, right_wrist: { x: 140, y: 125 },
  left_pinky: { x: 58, y: 135 }, right_pinky: { x: 142, y: 135 },
  left_index: { x: 62, y: 138 }, right_index: { x: 138, y: 138 },
  left_thumb: { x: 65, y: 130 }, right_thumb: { x: 135, y: 130 },

  // Legs
  left_knee: { x: 88, y: 190 }, right_knee: { x: 112, y: 190 },
  left_ankle: { x: 90, y: 250 }, right_ankle: { x: 110, y: 250 },
  left_heel: { x: 88, y: 260 }, right_heel: { x: 112, y: 260 },
  left_foot_index: { x: 92, y: 270 }, right_foot_index: { x: 108, y: 270 },
};

// Define connections for the diagram
export const DIAGRAM_CONNECTIONS = [
  // Head (simplified connections)
  ['nose', 'left_ear'], ['nose', 'right_ear'],

  // Torso
  ['left_shoulder', 'right_shoulder'],
  ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_shoulder', 'nose'],
  ['right_shoulder', 'nose'],
  ['left_hip', 'mid_hip'], ['right_hip', 'mid_hip'],

  // Arms
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['left_wrist', 'left_pinky'], ['left_wrist', 'left_index'], ['left_wrist', 'left_thumb'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['right_wrist', 'right_pinky'], ['right_wrist', 'right_index'], ['right_wrist', 'right_thumb'],

  // Legs
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['left_ankle', 'left_heel'], ['left_heel', 'left_foot_index'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['right_ankle', 'right_heel'], ['right_heel', 'right_foot_index'],
];

// Connections to be highlighted for Squat (hips, knees, ankles, and torso)
export const RAW_HIGHLIGHTED_CONNECTIONS = [
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['left_hip', 'right_hip'], // For pelvis stability
  ['left_shoulder', 'left_hip'], // For torso posture
  ['right_shoulder', 'right_hip'], // For torso posture
];

// Helper to normalize a connection string (e.g., ['A', 'B'] -> 'A-B')
export const normalizeConnection = (p1, p2) => {
  return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
};

// Create a Set of normalized highlighted connections for efficient lookup
export const HIGHLIGHTED_CONNECTIONS_SET = new Set(
  RAW_HIGHLIGHTED_CONNECTIONS.map(([p1, p2]) => normalizeConnection(p1, p2))
);

const DiagramOverlay = ({ side, onJointPositionsUpdate, highlightedConnections }) => { // Added 'highlightedConnections' prop
  const svgRef = useRef(null);

  const viewBoxWidth = 200;
  const viewBoxHeight = 300;

  // Use custom highlighted connections if provided, otherwise use default
  const connectionsToHighlight = highlightedConnections || RAW_HIGHLIGHTED_CONNECTIONS;
  
  // Create a Set of normalized highlighted connections for efficient lookup
  const highlightedConnectionsSet = new Set(
    connectionsToHighlight.map(([p1, p2]) => normalizeConnection(p1, p2))
  );
  
  // Helper to check if a connection is highlighted
  const isConnectionHighlighted = (p1, p2) => {
    return highlightedConnectionsSet.has(normalizeConnection(p1, p2));
  };

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const positions = {};

    for (const jointName in SKELETON_LAYOUT) {
      const layoutPos = SKELETON_LAYOUT[jointName];
      
      let xCoord = layoutPos.x;
      // Mirror x-coordinate for the right side diagram
      if (side === 'right') {
        xCoord = viewBoxWidth - layoutPos.x;
      }

      const relativeX = xCoord / viewBoxWidth;
      const relativeY = layoutPos.y / viewBoxHeight;

      positions[jointName] = {
        x: svgRect.left + relativeX * svgRect.width,
        y: svgRect.top + relativeY * svgRect.height,
      };
    }
    
    onJointPositionsUpdate(side, positions); // Pass side to callback
  }, [side, onJointPositionsUpdate]); // Removed filteredLayout from dependencies

  return (
    <div className={`diagram-overlay-container ${side}`}> {/* Add side class for CSS positioning */}
      <svg ref={svgRef} viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="skeleton-svg">
        {/* Draw Connections */}
        {DIAGRAM_CONNECTIONS.map(([start, end], i) => {
          const startPoint = SKELETON_LAYOUT[start];
          const endPoint = SKELETON_LAYOUT[end];
          if (!startPoint || !endPoint) return null;

          const isHighlighted = isConnectionHighlighted(start, end);
          const className = `diagram-bone ${isHighlighted ? 'highlighted-bone' : ''}`;

          // Apply mirroring to x-coordinates for rendering if side is 'right'
          let renderX1 = startPoint.x;
          let renderX2 = endPoint.x;
          if (side === 'right') {
            renderX1 = viewBoxWidth - startPoint.x;
            renderX2 = viewBoxWidth - endPoint.x;
          }

          return (
            <line
              key={`conn-${i}`}
              x1={renderX1}
              y1={startPoint.y}
              x2={renderX2}
              y2={endPoint.y}
              className={className}
            />
          );
        })}

        {/* Draw Joints */}
        {Object.entries(SKELETON_LAYOUT).map(([name, { x, y }]) => {
          let renderX = x;
          if (side === 'right') {
            renderX = viewBoxWidth - x;
          }
          return (
            <circle
              key={`joint-${name}`}
              cx={renderX}
              cy={y}
              r="4" 
              className="diagram-joint"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default DiagramOverlay;
