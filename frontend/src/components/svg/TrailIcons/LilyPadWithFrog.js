import React from 'react';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

const LilyPadWithFrog = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Organic Lily Pad Shape */}
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill={isCompleted ? '#4CAF50' : isPartiallyCompleted ? '#8BC34A' : isUnlocked ? '#66BB6A' : '#A5D6A7'}
    />

    {/* Frog Back Legs */}
    <Ellipse cx="24" cy="40" rx="5" ry="3" fill="#2E7D32"/>
    <Ellipse cx="40" cy="40" rx="5" ry="3" fill="#2E7D32"/>

    {/* Frog Body */}
    <Ellipse cx="32" cy="34" rx="10" ry="8" fill="#43A047"/>

    {/* Frog Front Legs */}
    <Path d="M26 34 Q22 30 24 28" stroke="#2E7D32" strokeWidth="2.5" fill="none"/>
    <Path d="M38 34 Q42 30 40 28" stroke="#2E7D32" strokeWidth="2.5" fill="none"/>

    {/* Frog Eyes */}
    <Circle cx="28" cy="26" r="3.5" fill="white"/>
    <Circle cx="36" cy="26" r="3.5" fill="white"/>
    <Circle cx="28" cy="26" r="1.5" fill="black"/>
    <Circle cx="36" cy="26" r="1.5" fill="black"/>
    <Circle cx="27.5" cy="25.5" r="0.5" fill="#fff"/>
    <Circle cx="35.5" cy="25.5" r="0.5" fill="#fff"/>

    {/* Frog Mouth */}
    <Path d="M28 36 Q32 39 36 36" stroke="#1B5E20" strokeWidth="1.5" fill="none"/>
  </Svg>
);

export default LilyPadWithFrog;