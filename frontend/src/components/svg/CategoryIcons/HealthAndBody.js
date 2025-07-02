import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const HealthAndBody = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Human Head - scaled up */}
    <Circle cx="32" cy="12" r="10" fill="#A0A0A0"/>

    {/* Body - scaled up */}
    <Path d="M20 22 Q32 28 44 22 Q46 40 32 60 Q18 40 20 22 Z" fill="#B0BEC5"/>

    {/* Heart (symbolizing health) - scaled up */}
    <Path d="M32 36 C28 30, 18 30, 18 40 C18 46, 32 52, 32 52 C32 52, 46 46, 46 40 C46 30, 36 30, 32 36 Z" fill="#E53935"/>
  </Svg>
);
            
            export default HealthAndBody;