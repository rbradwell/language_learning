import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const FamilyAndRelationships = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Adults */}
    <Circle cx="20" cy="20" r="6" fill="#4A90E2"/>
    <Circle cx="44" cy="20" r="6" fill="#F5A623"/>

    <Rect x="16" y="26" width="8" height="18" rx="2" fill="#4A90E2"/>
    <Rect x="40" y="26" width="8" height="18" rx="2" fill="#F5A623"/>

    {/* Child */}
    <Circle cx="32" cy="22" r="5" fill="#7ED321"/>
    <Rect x="29" y="27" width="6" height="14" rx="2" fill="#7ED321"/>

    {/* Heart between them */}
    <Path d="M32 48 C28 44, 20 40, 24 34 C26 31, 30 32, 32 36 C34 32, 38 31, 40 34 C44 40, 36 44, 32 48 Z" fill="#E94E77"/>
  </Svg>
);

export default FamilyAndRelationships;