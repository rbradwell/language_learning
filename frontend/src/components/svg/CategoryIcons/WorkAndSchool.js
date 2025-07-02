import React from 'react';
import Svg, { Polygon, Rect, Line, Circle } from 'react-native-svg';

const WorkAndSchool = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Graduation Cap */}
    <Polygon points="32,10 12,18 32,26 52,18" fill="#4A90E2"/>
    <Rect x="30" y="26" width="4" height="8" fill="#4A90E2"/>
    <Line x1="32" y1="26" x2="32" y2="34" stroke="#2C5AA0" strokeWidth="1"/>
    <Circle cx="32" cy="34" r="1.5" fill="#F5A623"/>

    {/* Briefcase */}
    <Rect x="16" y="38" width="32" height="18" rx="2" ry="2" fill="#B0BEC5" stroke="#666" strokeWidth="1.5"/>
    <Rect x="28" y="34" width="8" height="6" rx="1" fill="#757575"/>
    <Line x1="32" y1="38" x2="32" y2="56" stroke="#666" strokeWidth="1"/>
  </Svg>
);
        
        export default WorkAndSchool;