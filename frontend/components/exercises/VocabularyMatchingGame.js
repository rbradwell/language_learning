import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Timer } from '../common/Timer';

export default function VocabularyMatchingGame({ vocabulary, onComplete, timeLimit = 300 }) {
  const [nativeWords, setNativeWords] = useState([]);
  const [targetWords, setTargetWords] = useState([]);
  const [selectedNative, setSelectedNative] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [matches, setMatches] = useState([]);
  const [disabled, setDisabled] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [vocabulary]);

  const initializeGame = () => {
    const shuffledNative = [...vocabulary].sort(() => Math.random() - 0.5);
    const shuffledTarget = [...vocabulary].sort(() => Math.random() - 0.5);
    
    setNativeWords(shuffledNative);
    setTargetWords(shuffledTarget);
    setMatches([]);
    setDisabled([]);
    setScore(0);
    setSelectedNative(null);
    setSelectedTarget(null);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(timeLimit);
  };

  const handleNativeWordPress = (word, index) => {
    if (disabled.includes(`native-${index}`) || !gameStarted) return;
    
    setSelectedNative({ word, index });
    
    if (selectedTarget) {
      checkMatch({ word, index }, selectedTarget);
    }
  };

  const handleTargetWordPress = (word, index) => {
    if (disabled.includes(`target-${index}`) || !gameStarted) return;
    
    setSelectedTarget({ word, index });
    
    if (selectedNative) {
      checkMatch(selectedNative, { word, index });
    }
  };

  const checkMatch = (nativeSelection, targetSelection) => {
    const isCorrect = vocabulary.find(v => 
      v.nativeWord === nativeSelection.word.nativeWord && 
      v.targetWord === targetSelection.word.targetWord
    );

    if (isCorrect) {
      const newMatch = {
        native: nativeSelection,
        target: targetSelection,
        correct: true
      };
      
      setMatches(prev => [...prev, newMatch]);
      setDisabled(prev => [
        ...prev, 
        `native-${nativeSelection.index}`, 
        `target-${targetSelection.index}`
      ]);
      setScore(prev => prev + 10);
      
      // Check if game is complete
      if (matches.length + 1 === vocabulary.length) {
        completeGame();
      }
    } else {
      // Incorrect match - show feedback
      Alert.alert('Incorrect', 'Try again!');
    }
    
    setSelectedNative(null);
    setSelectedTarget(null);
  };

  const completeGame = () => {
    setGameStarted(false);
    const finalScore = Math.round((score / (vocabulary.length * 10)) * 100);
    onComplete(finalScore, matches);
  };

  const onTimeUp = () => {
    completeGame();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match the Words</Text>
        <Text style={styles.score}>Score: {score}</Text>
        {gameStarted && (
          <Timer 
            timeLimit={timeLimit} 
            onTimeUp={onTimeUp}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
          />
        )}
      </View>

      {!gameStarted && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {gameStarted && (
        <View style={styles.gameArea}>
          <View style={styles.wordsContainer}>
            <View style={styles.column}>
              <Text style={styles.columnHeader}>English</Text>
              {nativeWords.map((word, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.wordButton,
                    selectedNative?.index === index && styles.selectedWord,
                    disabled.includes(`native-${index}`) && styles.disabledWord
                  ]}
                  onPress={() => handleNativeWordPress(word, index)}
                  disabled={disabled.includes(`native-${index}`)}
                >
                  <Text style={styles.wordText}>{word.nativeWord}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.column}>
              <Text style={styles.columnHeader}>Target Language</Text>
              {targetWords.map((word, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.wordButton,
                    selectedTarget?.index === index && styles.selectedWord,
                    disabled.includes(`target-${index}`) && styles.disabledWord
                  ]}
                  onPress={() => handleTargetWordPress(word, index)}
                  disabled={disabled.includes(`target-${index}`)}
                >
                  <Text style={styles.wordText}>{word.targetWord}</Text>
                  {word.pronunciation && (
                    <Text style={styles.pronunciation}>{word.pronunciation}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SVG for drawing lines between matches */}
          <Svg style={styles.linesOverlay}>
            {matches.map((match, index) => (
              <Line
                key={index}
                x1="25%"
                y1={`${20 + (match.native.index * 60)}px`}
                x2="75%"
                y2={`${20 + (match.target.index * 60)}px`}
                stroke="#4CAF50"
                strokeWidth="2"
              />
            ))}
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  score: {
    fontSize: 18,
    color: '#007AFF',
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  wordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 10,
  },
  columnHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  wordButton: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedWord: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  disabledWord: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  wordText: {
    fontSize: 16,
    textAlign: 'center',
  },
  pronunciation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  linesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});