import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from 'react-native-svg';

const LilyPond = ({ width = 800, height = 600, ...props }) => {
  // Ensure we have valid numbers
  const safeWidth = Number(width) || 800;
  const safeHeight = Number(height) || 600;
  
  return (
  <Svg width={safeWidth} height={safeHeight} viewBox="0 0 800 600" {...props}>
    <Defs>
      <RadialGradient id="pondGradient" cx="50%" cy="50%" r="70%">
        <Stop offset="0%" stopColor="#B3E5FC"/>
        <Stop offset="100%" stopColor="#0288D1"/>
      </RadialGradient>
    </Defs>

    {/* Pond Background */}
    <Rect width="100%" height="100%" fill="url(#pondGradient)" rx="20" />

    {/* Decorative lily pads scattered in background */}
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill="#6DBF4B" 
      opacity="0.3"
      transform="translate(100, 150) rotate(15) scale(1.0)"
    />
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill="#4CAF50" 
      opacity="0.3"
      transform="translate(300, 100) rotate(15) scale(0.75)"
    />
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill="#66BB6A" 
      opacity="0.3"
      transform="translate(500, 220) rotate(-10) scale(1.09)"
    />
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill="#4CAF50" 
      opacity="0.3"
      transform="translate(250, 350) rotate(5) scale(0.94)"
    />
    <Path 
      d="M32,4 C16,6,6,20,8,34 C10,48,24,60,38,58 C52,56,60,44,60,32 C60,20,52,10,40,6 C36,5,32,10,32,18 L40,32 L32,32 Z" 
      fill="#66BB6A" 
      opacity="0.3"
      transform="translate(600, 400) rotate(-20) scale(0.78)"
    />
  </Svg>
  );
};

export default LilyPond;