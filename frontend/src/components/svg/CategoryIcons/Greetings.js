import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const Greetings = ({ width = 64, height = 64, isCompleted, isUnlocked, isPartiallyCompleted, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" {...props}>
    {/* Left person */}
    <Circle cx="18" cy="18" r="6" fill="#4A90E2"/>
    <Path d="M14 24 Q14 36 18 42 Q20 44 22 42 Q26 38 26 34" fill="#4A90E2"/>
    <Path d="M12 30 Q8 24 14 22" stroke="#4A90E2" strokeWidth="2" fill="none"/>

    {/* Right person */}
    <Circle cx="46" cy="18" r="6" fill="#F5A623"/>
    <Path d="M42 24 Q42 36 46 42 Q48 44 50 42 Q54 38 54 34" fill="#F5A623"/>
    <Path d="M52 30 Q56 24 50 22" stroke="#F5A623" strokeWidth="2" fill="none"/>

    {/* Connection / wave lines */}
    <Path d="M26 28 Q32 34 38 28" stroke="#888" strokeWidth="1.5" fill="none"/>
  </Svg>
);
    
    export default Greetings;