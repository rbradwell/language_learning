import React from 'react';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';

const WeatherAndTime = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Sun - scaled up */}
    <Circle cx="16" cy="16" r="10" fill="#FFD700"/>
    <G stroke="#FFD700" strokeWidth="3">
      <Line x1="16" y1="2" x2="16" y2="6"/>
      <Line x1="16" y1="26" x2="16" y2="30"/>
      <Line x1="2" y1="16" x2="6" y2="16"/>
      <Line x1="26" y1="16" x2="30" y2="16"/>
      <Line x1="6" y1="6" x2="10" y2="10"/>
      <Line x1="22" y1="6" x2="26" y2="10"/>
      <Line x1="6" y1="26" x2="10" y2="22"/>
      <Line x1="22" y1="26" x2="26" y2="22"/>
    </G>

    {/* Clock - scaled up */}
    <Circle cx="48" cy="48" r="14" fill="#F5F5F5" stroke="#888" strokeWidth="3"/>
    <Line x1="48" y1="48" x2="48" y2="38" stroke="#333" strokeWidth="3"/>
    <Line x1="48" y1="48" x2="54" y2="48" stroke="#333" strokeWidth="3"/>
  </Svg>
);
            
            export default WeatherAndTime;