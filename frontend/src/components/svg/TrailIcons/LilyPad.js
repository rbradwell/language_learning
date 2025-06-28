import React from 'react';
import Svg, { Path } from 'react-native-svg';

const LilyPad = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill={isCompleted ? '#4CAF50' : isPartiallyCompleted ? '#8BC34A' : isUnlocked ? '#66BB6A' : '#A5D6A7'}
    />
  </Svg>
);

export default LilyPad;