import React from 'react';
import Svg, { Path, Circle, Text } from 'react-native-svg';

const ShoppingAndMoney = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Shopping cart */}
    <Path d="M12 16 H16 L20 40 H46 L52 24 H24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinejoin="round"/>
    <Circle cx="24" cy="48" r="3" fill="#4A90E2"/>
    <Circle cx="44" cy="48" r="3" fill="#4A90E2"/>

    {/* Coin */}
    <Circle cx="50" cy="14" r="8" fill="#F5A623" stroke="#E08800" strokeWidth="1.5"/>
    <Text x="50" y="18" fontSize="8" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold">$</Text>
  </Svg>
);
                
                export default ShoppingAndMoney;