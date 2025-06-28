import React from 'react';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

const Frog = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>

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

export default Frog;