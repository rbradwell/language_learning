import React from 'react';
import Svg, { Path, Circle, Text, Rect } from 'react-native-svg';

const ShoppingAndMoney = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Shopping cart - scaled up */}
    <Path d="M4 12 H12 L18 48 H52 L60 20 H20" fill="none" stroke="#4A90E2" strokeWidth="4" strokeLinejoin="round"/>
    <Circle cx="24" cy="56" r="5" fill="#4A90E2"/>
    <Circle cx="48" cy="56" r="5" fill="#4A90E2"/>

    {/* Coin - scaled up */}
    <Circle cx="48" cy="12" r="12" fill="#F5A623" stroke="#E08800" strokeWidth="2"/>
    <Text x="48" y="18" fontSize="12" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold">$</Text>
  </Svg>
);
                
                export default ShoppingAndMoney;