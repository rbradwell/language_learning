import React from 'react';
import Svg, { Polygon, Rect, Line, Circle } from 'react-native-svg';

const WorkAndSchool = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Graduation Cap - scaled up */}
    <Polygon points="32,2 4,14 32,26 60,14" fill="#4A90E2"/>
    <Rect x="28" y="26" width="8" height="12" fill="#4A90E2"/>
    <Line x1="32" y1="26" x2="32" y2="38" stroke="#2C5AA0" strokeWidth="2"/>
    <Circle cx="32" cy="38" r="3" fill="#F5A623"/>

    {/* Briefcase - scaled up */}
    <Rect x="8" y="40" width="48" height="22" rx="3" ry="3" fill="#B0BEC5" stroke="#666" strokeWidth="2"/>
    <Rect x="24" y="34" width="16" height="8" rx="2" fill="#757575"/>
    <Line x1="32" y1="40" x2="32" y2="62" stroke="#666" strokeWidth="2"/>
  </Svg>
);
        
        export default WorkAndSchool;