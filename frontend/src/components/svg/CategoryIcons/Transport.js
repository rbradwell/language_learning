import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const Transport = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Car Body */}
    <Path d="M12 36 Q14 28 20 24 H44 Q50 28 52 36 Z" fill="#4A90E2" stroke="#2C5AA0" strokeWidth="2"/>
    
    {/* Roof */}
    <Path d="M22 24 L26 16 H38 L42 24 Z" fill="#B0C4DE" stroke="#2C5AA0" strokeWidth="1.5"/>
    
    {/* Windows */}
    <Rect x="27" y="18" width="6" height="6" fill="white" stroke="#2C5AA0" strokeWidth="1"/>
    <Rect x="35" y="18" width="6" height="6" fill="white" stroke="#2C5AA0" strokeWidth="1"/>

    {/* Wheels */}
    <Circle cx="20" cy="44" r="4" fill="#333"/>
    <Circle cx="44" cy="44" r="4" fill="#333"/>
  </Svg>
);
            
            export default Transport;