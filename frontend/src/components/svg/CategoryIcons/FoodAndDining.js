import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const FoodAndDining = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Large plate filling most of the space */}
    <Circle cx="32" cy="32" r="28" fill="#F5F5F5" stroke="#CCCCCC" strokeWidth="3"/>
    <Circle cx="32" cy="32" r="20" fill="none" stroke="#AAAAAA" strokeWidth="2"/>

    {/* Fork - scaled up */}
    <Rect x="8" y="8" width="4" height="28" fill="#888"/>
    <Rect x="6" y="8" width="2" height="10" fill="#888"/>
    <Rect x="8" y="8" width="2" height="10" fill="#888"/>
    <Rect x="10" y="8" width="2" height="10" fill="#888"/>

    {/* Knife - scaled up */}
    <Path d="M56 8 Q58 16 56 54" fill="#aaa" stroke="#888" strokeWidth="2"/>
  </Svg>
);
    
export default FoodAndDining;