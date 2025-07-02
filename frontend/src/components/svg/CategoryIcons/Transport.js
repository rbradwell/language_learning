import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const Transport = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Car Body - scaled up */}
    <Path d="M4 42 Q6 30 16 24 H48 Q58 30 60 42 Z" fill="#4A90E2" stroke="#2C5AA0" strokeWidth="3"/>
    
    {/* Roof - scaled up */}
    <Path d="M18 24 L22 8 H42 L46 24 Z" fill="#B0C4DE" stroke="#2C5AA0" strokeWidth="2"/>
    
    {/* Windows - scaled up */}
    <Rect x="24" y="12" width="8" height="10" fill="white" stroke="#2C5AA0" strokeWidth="1.5"/>
    <Rect x="34" y="12" width="8" height="10" fill="white" stroke="#2C5AA0" strokeWidth="1.5"/>

    {/* Wheels - scaled up */}
    <Circle cx="16" cy="52" r="8" fill="#333"/>
    <Circle cx="48" cy="52" r="8" fill="#333"/>
  </Svg>
);
            
            export default Transport;