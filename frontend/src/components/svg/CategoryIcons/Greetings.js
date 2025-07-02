import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const Greetings = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* White background */}
    <Rect x="0" y="0" width="64" height="64" fill="white"/>
    
    {/* Left person - scaled up */}
    <Circle cx="16" cy="16" r="10" fill="#4A90E2"/>
    <Path d="M8 26 Q8 44 16 54 Q20 58 24 54 Q32 46 32 40" fill="#4A90E2"/>
    <Path d="M6 36 Q0 26 10 22" stroke="#4A90E2" strokeWidth="3" fill="none"/>

    {/* Right person - scaled up */}
    <Circle cx="48" cy="16" r="10" fill="#F5A623"/>
    <Path d="M40 26 Q40 44 48 54 Q52 58 56 54 Q64 46 64 40" fill="#F5A623"/>
    <Path d="M58 36 Q64 26 54 22" stroke="#F5A623" strokeWidth="3" fill="none"/>

    {/* Connection / wave lines - scaled up */}
    <Path d="M32 34 Q32 42 32 34" stroke="#888" strokeWidth="3" fill="none"/>
    <Path d="M24 30 Q32 38 40 30" stroke="#888" strokeWidth="2" fill="none"/>
  </Svg>
);
    
    export default Greetings;