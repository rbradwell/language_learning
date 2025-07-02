import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const FamilyAndRelationships = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Adults - scaled up */}
    <Circle cx="16" cy="16" r="8" fill="#4A90E2"/>
    <Circle cx="48" cy="16" r="8" fill="#F5A623"/>

    <Rect x="10" y="24" width="12" height="24" rx="3" fill="#4A90E2"/>
    <Rect x="42" y="24" width="12" height="24" rx="3" fill="#F5A623"/>

    {/* Child - scaled up */}
    <Circle cx="32" cy="20" r="7" fill="#7ED321"/>
    <Rect x="27" y="27" width="10" height="20" rx="3" fill="#7ED321"/>

    {/* Heart between them - scaled up */}
    <Path d="M32 58 C26 52, 14 46, 20 36 C23 31, 29 33, 32 39 C35 33, 41 31, 44 36 C50 46, 38 52, 32 58 Z" fill="#E94E77"/>
  </Svg>
);

export default FamilyAndRelationships;