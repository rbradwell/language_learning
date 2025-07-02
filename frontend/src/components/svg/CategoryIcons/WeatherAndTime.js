import React from 'react';
import Svg, { Circle, G, Line } from 'react-native-svg';

const WeatherAndTime = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Sun */}
    <Circle cx="20" cy="20" r="6" fill="#FFD700"/>
    <G stroke="#FFD700" strokeWidth="2">
      <Line x1="20" y1="8" x2="20" y2="4"/>
      <Line x1="20" y1="32" x2="20" y2="36"/>
      <Line x1="8" y1="20" x2="4" y2="20"/>
      <Line x1="32" y1="20" x2="36" y2="20"/>
      <Line x1="10" y1="10" x2="7" y2="7"/>
      <Line x1="30" y1="10" x2="33" y2="7"/>
      <Line x1="10" y1="30" x2="7" y2="33"/>
      <Line x1="30" y1="30" x2="33" y2="33"/>
    </G>

    {/* Clock */}
    <Circle cx="44" cy="44" r="10" fill="#F5F5F5" stroke="#888" strokeWidth="2"/>
    <Line x1="44" y1="44" x2="44" y2="38" stroke="#333" strokeWidth="2"/>
    <Line x1="44" y1="44" x2="48" y2="44" stroke="#333" strokeWidth="2"/>
  </Svg>
);
            
            export default WeatherAndTime;