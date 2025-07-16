// src/components/FeedbackAnimation.js
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const FeedbackAnimation = ({ visible, type, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Reset animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      
      // Use setTimeout to defer animations to avoid scheduling during render
      timeoutRef.current = setTimeout(() => {
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Hide after delay
          timeoutRef.current = setTimeout(() => {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(scaleAnim, {
                toValue: 0,
                tension: 100,
                friction: 6,
                useNativeDriver: true,
              }),
            ]).start(() => {
              if (onComplete) onComplete();
            });
          }, 1000);
        });
      }, 0);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, type, fadeAnim, scaleAnim, onComplete]);

  if (!visible) return null;

  const isCorrect = type === 'correct';

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.feedback,
          isCorrect ? styles.correct : styles.incorrect,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.feedbackText}>
          {isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedback: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  correct: {
    backgroundColor: '#4CAF50',
  },
  incorrect: {
    backgroundColor: '#F44336',
  },
  feedbackText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FeedbackAnimation;