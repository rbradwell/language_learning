# Exercise Architecture Design Document

## Overview

This document outlines the **unified architecture** for handling all exercise types in the language learning application. The system employs a consistent approach where all exercises create `Exercise` records, with vocabulary matching exercises enhanced by dynamic session management for content selection.

## Session Scope

**Design Decision: Session per Exercise**

Each `ExerciseSession` is scoped to a single `Exercise`, not a `TrailStep`. This provides:
- Clear completion boundaries per exercise
- Independent progress tracking per exercise
- Simpler state management with single-purpose sessions
- Better user experience for individual exercise completion
- Flexible session management (different timeouts, pause/resume per exercise)

**Relationship Hierarchy:**
```
Trail → TrailStep → Exercise → ExerciseSession → Vocabulary Items
                  ↘ Exercise → ExerciseSession → Vocabulary Items  
```

# Exercise Architecture Design Document

## Overview

This document outlines the **unified architecture** for handling all exercise types in the language learning application. The system employs a consistent **session-per-exercise** approach where:

- **All exercise types** create `Exercise` records in the database
- **All submissions** reference an `exerciseId` for consistent tracking
- **Vocabulary matching exercises** additionally use `ExerciseSession` for dynamic vocabulary selection
- **All other exercises** submit answers directly without sessions

This provides a **single, consistent API flow** across all exercise types while still supporting the dynamic requirements of vocabulary matching.

## Session Scope

**Design Decision: Session per Exercise**

Each `ExerciseSession` is scoped to a single `Exercise`, providing:
- Clear completion boundaries per exercise
- Independent progress tracking per exercise
- Simpler state management with single-purpose sessions
- Better user experience for individual exercise completion
- Flexible session management (different timeouts, pause/resume per exercise)

**Relationship Hierarchy:**
```
Trail → TrailStep → Exercise → ExerciseSession (vocabulary_matching only)
                  ↘ Exercise → Direct submission (sentence_completion, fill_blanks)
```

## Unified Exercise Architecture

### Core Principle: Consistent Exercise Management

**All exercise types** follow the same pattern:

1. ✅ **Exercise Record**: Every exercise creates a record in the `Exercise` table
2. ✅ **Consistent API**: All exercises use `/trail-step/{id}` to retrieve and have `exerciseId` in submissions  
3. ✅ **Unified Tracking**: All answers are stored in `UserAnswer` with `exerciseId` reference
4. ✅ **Flexible Enhancement**: `vocabulary_matching` adds session management for dynamic content

### Exercise Type Specializations

The system handles different exercise types through **content configuration** and **optional session enhancement**:

| Exercise Type | Exercise Record | Session Used | Submission Method |
|---------------|----------------|--------------|-------------------|
| `vocabulary_matching` | ✅ Configuration | ✅ Dynamic vocabulary | Individual answers via session |
| `sentence_completion` | ✅ Complete content | ❌ Direct | Complete exercise submission |
| `fill_blanks` | ✅ Complete content | ❌ Direct | Complete exercise submission |

#### 1. Vocabulary Matching - Session-Enhanced

**Exercise Type**: `vocabulary_matching`

**Approach**: Exercise record + dynamic session for vocabulary selection

##### How It Works

1. **Exercise record created** with vocabulary selection configuration
2. **ExerciseSession created** for dynamic vocabulary management
3. **Runtime vocabulary selection** from the `Vocabulary` table
4. **Individual answer tracking** through both exercise and session references

##### Database Structure

```sql
-- Exercise record with vocabulary_matching configuration
Exercise: {
  id: "exercise-uuid",
  trailStepId: "step-uuid",
  type: "vocabulary_matching",
  content: {
    "vocabularyCount": 8,
    "categoryId": "category-uuid", 
    "difficulty": "beginner",
    "instructions": "Match the English words with their Portuguese translations"
  },
  order: 1
}

-- Session created per exercise for dynamic vocabulary management
ExerciseSession: {
  exerciseId: "exercise-uuid",        -- Links to specific exercise
  userId: "user-uuid",
  trailStepId: "step-uuid",          -- Denormalized for easier querying
  totalQuestions: 8,
  status: 'in_progress'
}

-- Junction table links session to randomly selected vocabulary
ExerciseSessionVocabulary: [
  { sessionId, vocabularyId: vocab1 },
  { sessionId, vocabularyId: vocab2 },
  -- ... 8 random vocabulary items for this specific exercise
]

-- Individual answers tracked with both exercise and session references
UserAnswer: [
  { 
    exerciseId: "exercise-uuid",
    sessionId: "session-uuid", 
    vocabularyId: vocab1, 
    userAnswer: "Olá", 
    isCorrect: true 
  }
]
```

##### API Flow

```javascript
// 1. Get exercises for trail step - includes sessions for vocabulary_matching
GET /api/exercises/trail-step/{trailStepId}
// Returns: All exercises with sessionId for vocabulary_matching types

// 2. Submit individual vocabulary answers
POST /api/exercises/submit-answer
{
  "exerciseId": "exercise-uuid",     // Identifies the exercise
  "sessionId": "session-uuid",       // Identifies the session within exercise
  "vocabularyId": "vocab-uuid", 
  "userAnswer": "Olá",
  "timeSpent": 15
}
```

#### 2. Sentence Completion & Fill-in-the-Blanks - Direct Submission

**Exercise Types**: `sentence_completion`, `fill_blanks`

**Approach**: Exercise record with complete content + direct submission

##### How It Works

1. **Exercise record created** with complete question content
2. **No session needed** - content is pre-defined
3. **Complete exercise submission** with all answers at once
4. **UserAnswer records created** for each question within the exercise

##### Database Structure

```sql
-- Exercise record with complete sentence_completion content
Exercise: {
  id: "exercise-uuid",
  trailStepId: "step-uuid", 
  type: "sentence_completion",
  content: {
    "questions": [
      {
        "id": 1,
        "sentence": "I am going to the ___",
        "options": ["store", "house", "park", "school"],
        "correctAnswer": "store",
        "explanation": "Context suggests a shopping activity"
      },
      {
        "id": 2, 
        "sentence": "The weather is ___ today",
        "options": ["beautiful", "car", "book"],
        "correctAnswer": "beautiful"
      }
    ],
    "instructions": "Choose the best word to complete each sentence"
  },
  order: 1
}

-- Direct answer submission without sessions
UserAnswer: [
  {
    exerciseId: "exercise-uuid",
    sessionId: null,                   -- No session for direct exercises
    vocabularyId: null,                -- No vocabulary reference
    userAnswer: "store",
    correctAnswer: "store", 
    isCorrect: true,
    questionData: { "questionId": 1, "sentence": "I am going to the ___" }
  }
]
```

##### API Flow

```javascript
// 1. Get exercises for trail step - returns complete content
GET /api/exercises/trail-step/{trailStepId}
// Returns: Exercise with full question content

// 2. Submit complete exercise with all answers
POST /api/exercises/submit-exercise
{
  "exerciseId": "exercise-uuid",
  "answers": [
    { "questionId": 1, "answer": "store" },
    { "questionId": 2, "answer": "beautiful" }
  ],
  "timeSpent": 120
}
```

## Implementation Details

### Controller Logic

```javascript
const getExercisesByTrailStep = async (req, res) => {
  const { trailStepId } = req.params;
  const userId = req.user.id;

  // Get ALL exercises for this trail step (unified approach)
  const exercises = await Exercise.findAll({
    where: { trailStepId },
    order: [['order', 'ASC']]
  });

  const exerciseResponses = [];

  for (const exercise of exercises) {
    if (exercise.type === 'vocabulary_matching') {
      // VOCABULARY_MATCHING: Create/resume session for dynamic vocabulary
      
      let session = await ExerciseSession.findOne({
        where: { 
          userId, 
          exerciseId: exercise.id,
          status: 'in_progress',
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{ model: Vocabulary, through: { attributes: [] } }]
      });

      if (!session) {
        // Create new session with random vocabulary selection
        session = await createExerciseSession(userId, exercise);
      }

      // Return exercise with session data
      exerciseResponses.push({
        exerciseId: exercise.id,
        sessionId: session.id,
        type: exercise.type,
        order: exercise.order,
        vocabulary: session.Vocabularies.map(v => ({
          id: v.id,
          nativeWord: v.nativeWord,
          targetWord: v.targetWord,
          pronunciation: v.pronunciation,
          answered: checkIfAnswered(session.id, v.id)
        })),
        progress: calculateSessionProgress(session)
      });
      
    } else {
      // SENTENCE_COMPLETION & FILL_BLANKS: Return exercise content directly
      
      exerciseResponses.push({
        exerciseId: exercise.id,
        sessionId: null, // No session for direct exercises
        type: exercise.type,
        order: exercise.order,
        content: JSON.parse(exercise.content),
        progress: calculateExerciseProgress(userId, exercise.id)
      });
    }
  }

  res.json({
    trailStep: await getTrailStepInfo(trailStepId),
    exercises: exerciseResponses
  });
};

const submitAnswer = async (req, res) => {
  // For vocabulary_matching exercises only
  const { exerciseId, sessionId, vocabularyId, userAnswer, timeSpent } = req.body;
  
  // Validate session belongs to exercise
  const session = await ExerciseSession.findOne({
    where: { id: sessionId, exerciseId },
    include: [{ model: Exercise }]
  });

  if (!session) {
    return res.status(400).json({ error: 'Invalid session or exercise' });
  }

  // Process vocabulary answer...
  const result = await processVocabularyAnswer(session, vocabularyId, userAnswer, timeSpent);
  
  res.json(result);
};

const submitExercise = async (req, res) => {
  // For sentence_completion and fill_blanks exercises
  const { exerciseId, answers, timeSpent } = req.body;
  
  const exercise = await Exercise.findByPk(exerciseId);
  const content = JSON.parse(exercise.content);
  
  // Process all answers for the exercise...
  const results = await processExerciseAnswers(exercise, answers, timeSpent);
  
  res.json(results);
};
```

### Model Relationships

```javascript
// Exercise - Contains all exercise types with unified structure
Exercise.belongsTo(TrailStep, { foreignKey: 'trailStepId' });
Exercise.hasOne(ExerciseSession, { foreignKey: 'exerciseId' }); // Only for vocabulary_matching
Exercise.hasMany(UserAnswer, { foreignKey: 'exerciseId' }); // All exercise types

// ExerciseSession - Scoped to individual vocabulary_matching exercises
ExerciseSession.belongsTo(Exercise, { foreignKey: 'exerciseId' });
ExerciseSession.belongsTo(TrailStep, { foreignKey: 'trailStepId' }); // Denormalized
ExerciseSession.belongsToMany(Vocabulary, { 
  through: 'ExerciseSessionVocabulary' 
});

// UserAnswer - Tracks answers for all exercise types
UserAnswer.belongsTo(Exercise, { foreignKey: 'exerciseId' }); // Required for all
UserAnswer.belongsTo(ExerciseSession, { foreignKey: 'sessionId' }); // Only vocabulary_matching
UserAnswer.belongsTo(Vocabulary, { foreignKey: 'vocabularyId' }); // Only vocabulary_matching
```
});

// Exercise - Contains all exercise types
Exercise.belongsTo(TrailStep, { foreignKey: 'trailStepId' });
Exercise.hasOne(ExerciseSession, { foreignKey: 'exerciseId' }); // For vocabulary_matching

// UserAnswer - Tracks answers for both session-based and direct exercises
UserAnswer.belongsTo(ExerciseSession, { foreignKey: 'sessionId' }); // For vocabulary_matching
UserAnswer.belongsTo(Exercise, { foreignKey: 'exerciseId' }); // For all exercise types
```

## Example Data Structures

### Vocabulary Matching Response

```json
{
  "trailStep": {
    "id": "step-uuid",
    "name": "Basic Greetings",
    "type": "vocabulary_matching"
  },
  "exercises": [
    {
      "exerciseId": "exercise1-uuid",        // NEW: Exercise identifier
      "sessionId": "session1-uuid",
      "type": "vocabulary_matching", 
      "order": 1,
      "vocabulary": [
        {
          "id": "vocab1-uuid",
          "nativeWord": "Hello",
          "targetWord": "Olá", 
          "pronunciation": "oh-LAH",
          "answered": false
        }
      ],
      "progress": {
        "answeredCount": 0,
        "correctCount": 0,
        "isResume": false
      }
    },
    {
      "exerciseId": "exercise2-uuid",        // Second exercise in same step
      "sessionId": "session2-uuid", 
      "type": "vocabulary_matching",
      "order": 2,
      "vocabulary": [
        {
          "id": "vocab5-uuid",
          "nativeWord": "Thank you",
          "targetWord": "Obrigado",
          "pronunciation": "oh-bree-GAH-doo", 
          "answered": false
        }
      ],
      "progress": {
        "answeredCount": 0,
        "correctCount": 0,
        "isResume": false
      }
    }
  ]
}
```

### Sentence Completion Response

```json
{
  "trailStep": {
    "id": "step-uuid", 
    "name": "Daily Activities",
    "type": "sentence_completion"
  },
  "exercises": [
    {
      "id": "exercise1-uuid",
      "type": "sentence_completion",
      "order": 1,
      "content": {
        "sentence": "Eu gosto de ___ futebol",
        "options": ["jogar", "comer", "dormir", "estudar"],
        "correctAnswer": "jogar",
        "explanation": "The verb 'jogar' means 'to play' and is used with sports",
        "culturalNote": "Football is the most popular sport in Brazil"
      }
    }
  ]
}
```

## Design Rationale

This **unified architecture** provides:

**Consistency Benefits:**
- ✅ **Single API pattern**: All exercises retrieved via same endpoint
- ✅ **Consistent identification**: Every submission includes `exerciseId`
- ✅ **Unified analytics**: All answers tracked through same `UserAnswer` table
- ✅ **Simplified frontend**: Same data structures and patterns

**Flexibility Benefits:**
- ✅ **Dynamic content**: Vocabulary exercises get fresh content each session
- ✅ **Curated content**: Sentence/fill-blank exercises maintain high-quality authored content
- ✅ **Independent completion**: Each exercise is self-contained
- ✅ **Multiple exercises per step**: Easily support complex learning progressions

**Developer Benefits:**
- ✅ **Code consistency**: Same patterns for all exercise types
- ✅ **Clear separation**: Session logic only where needed (vocabulary matching)
- ✅ **Easy extensions**: New exercise types follow same pattern
- ✅ **Maintainable**: Single source of truth for exercise management

## Future Considerations

- **Adaptive vocabulary selection**: Use user performance data to influence vocabulary selection
- **Hybrid exercises**: Combine dynamic and pre-stored elements within single exercises  
- **Content generation**: AI-assisted creation of sentence completion exercises
- **Analytics enhancement**: Leverage unified tracking for cross-exercise insights