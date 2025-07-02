import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const HealthAndBody = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Human Head */}
    <Circle cx="32" cy="14" r="6" fill="#A0A0A0"/>

    {/* Body */}
    <Path d="M26 22 Q32 26 38 22 Q40 34 32 50 Q24 34 26 22 Z" fill="#B0BEC5"/>

    {/* Heart (symbolizing health) */}
    <Path d="M32 30 C30 26, 24 26, 24 32 C24 36, 32 40, 32 40 C32 40, 40 36, 40 32 C40 26, 34 26, 32 30 Z" fill="#E53935"/>
  </Svg>
);
            
            export default HealthAndBody;