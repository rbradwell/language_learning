import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const FoodAndDining = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Plate */}
    <Circle cx="32" cy="32" r="20" fill="#F5F5F5" stroke="#CCCCCC" strokeWidth="2"/>
    <Circle cx="32" cy="32" r="12" fill="none" stroke="#AAAAAA" strokeWidth="1.5"/>

    {/* Fork */}
    <Rect x="12" y="16" width="2" height="20" fill="#888"/>
    <Rect x="11" y="16" width="1" height="6" fill="#888"/>
    <Rect x="12" y="16" width="1" height="6" fill="#888"/>
    <Rect x="13" y="16" width="1" height="6" fill="#888"/>

    {/* Knife */}
    <Path d="M50 16 Q52 22 50 46" fill="#aaa" stroke="#888" strokeWidth="1"/>
  </Svg>
);
    
export default FoodAndDining;