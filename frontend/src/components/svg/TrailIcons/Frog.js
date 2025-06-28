import React, { useEffect, useRef } from 'react';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { Animated } from 'react-native';

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Frog = ({ width = 80, height = 64, ...props }) => {
  const legAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(legAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(legAnimation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    startAnimation();
  }, [legAnimation]);

  // Interpolate leg positions for animation
  const leftLegPath = legAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'M36 44 Q30 52 34 58',
      'M35 44 Q28 50 32 58', 
      'M36 44 Q30 52 34 58'
    ],
  });

  const rightLegPath = legAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'M44 44 Q50 52 46 58',
      'M45 44 Q52 50 48 58',
      'M44 44 Q50 52 46 58'
    ],
  });

  return (
    <Svg width={width} height={height} viewBox="0 0 80 64" {...props}>
      {/* Back Left Leg - Animated */}
      <AnimatedPath
        d={leftLegPath}
        fill="#2E7D32"
      />

      {/* Back Right Leg - Animated */} 
      <AnimatedPath
        d={rightLegPath}
        fill="#2E7D32"
      />

      {/* Body */}
      <Ellipse cx="40" cy="36" rx="12" ry="9" fill="#43A047"/>

      {/* Front Legs */}
      <Path d="M34 34 Q30 28 32 25" stroke="#2E7D32" strokeWidth="2.5" fill="none"/>
      <Path d="M46 34 Q50 28 48 25" stroke="#2E7D32" strokeWidth="2.5" fill="none"/>

      {/* Eyes */}
      <Circle cx="34" cy="26" r="4" fill="white"/>
      <Circle cx="46" cy="26" r="4" fill="white"/>
      <Circle cx="34" cy="26" r="2" fill="black"/>
      <Circle cx="46" cy="26" r="2" fill="black"/>
      <Circle cx="33.5" cy="25.5" r="0.5" fill="#fff"/>
      <Circle cx="45.5" cy="25.5" r="0.5" fill="#fff"/>

      {/* Mouth */}
      <Path d="M34 40 Q40 43 46 40" stroke="#1B5E20" strokeWidth="1.5" fill="none"/>
    </Svg>
  );
};

export default Frog;