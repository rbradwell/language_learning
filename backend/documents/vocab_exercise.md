# Vocabulary Exercise System Documentation

## Overview

This document describes the unified vocabulary exercise system that creates pre-defined Exercise records from existing vocabulary data, enabling consistent session management and progress tracking.

## Architecture

The system uses a **unified approach** where:

1. **Exercise records** are created from vocabulary data and stored in the database
2. **ExerciseSession** links users to specific exercises for dynamic session management
3. **Vocabulary selection** is pre-determined per exercise but shuffled during sessions
4. **Progress tracking** works consistently across all exercise types

## Database Structure

```sql
-- Exercise: Contains pre-defined vocabulary sets
Exercise {
  id: UUID,
  trailStepId: UUID,
  type: 'vocabulary_matching',
  content: JSON, -- Contains vocabularyIds and metadata
  order: INTEGER
}

-- ExerciseSession: Links users to specific exercises
ExerciseSession {
  id: UUID,
  userId: UUID,
  exerciseId: UUID,        -- Links to specific Exercise
  trailStepId: UUID,       -- Denormalized for easier querying
  totalQuestions: INTEGER,
  status: ENUM('in_progress', 'completed', 'abandoned')
}

-- ExerciseSessionVocabulary: Links sessions to vocabulary items
ExerciseSessionVocabulary {
  sessionId: UUID,
  vocabularyId: UUID
}
```

## Bulk Exercise Creation

### Purpose

The bulk creation endpoint processes all vocabulary data and creates structured Exercise records that contain fixed sets of vocabulary items (typically 10 words per exercise).

### API Endpoint

```http
POST /api/exercises/bulk-create-vocabulary-exercises
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `wordsPerExercise` | Integer | 10 | Number of vocabulary items per exercise (5-20) |
| `categoryId` | UUID | null | Create exercises for specific category only |
| `trailStepId` | UUID | null | Create exercises for specific trail step only |
| `dryRun` | Boolean | false | Preview results without creating exercises |

### Example Requests

#### Create exercises for all vocabulary_matching trail steps
```json
{
  "wordsPerExercise": 10,
  "dryRun": false
}
```

#### Create exercises for specific category
```json
{
  "wordsPerExercise": 8,
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "dryRun": false
}
```

#### Preview without creating (dry run)
```json
{
  "wordsPerExercise": 12,
  "dryRun": true
}
```

### Response Format

```json
{
  "success": true,
  "message": "Vocabulary exercises created successfully",
  "dryRun": false,
  "results": {
    "summary": {
      "totalVocabulary": 156,
      "exercisesCreated": 16,
      "categoriesProcessed": 2,
      "trailStepsProcessed": 4
    },
    "details": [
      {
        "trailStepId": "uuid",
        "trailStepName": "Basic Portuguese Words",
        "categoryId": "uuid", 
        "categoryName": "Portuguese Basics",
        "vocabularyCount": 43,
        "exercisesCreated": 5,
        "wordsPerExercise": 10
      }
    ],
    "errors": []
  }
}
```

## Exercise Content Structure

Each created Exercise contains JSON content with the following structure:

```json
{
  "vocabularyCount": 10,
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "categoryName": "Portuguese Basics",
  "difficulty": 1,
  "instructions": "Match the Portuguese Basics words with their translations",
  "vocabularyIds": [
    "vocab-uuid-1",
    "vocab-uuid-2",
    // ... up to vocabularyCount
  ],
  "vocabularyItems": [
    {
      "id": "vocab-uuid-1",
      "nativeWord": "Hello",
      "targetWord": "Olá",
      "pronunciation": "oh-LAH",
      "difficulty": 1
    }
    // ... complete vocabulary data for offline access
  ]
}
```

## Session Management

### Exercise Selection Logic

When a user starts a vocabulary exercise:

1. **Find uncompleted exercises** - Prioritize exercises the user hasn't finished
2. **Fallback to random selection** - For practice after completing all exercises
3. **Shuffle vocabulary** - Randomize order within the selected exercise for variety

### Session Creation Process

```javascript
// 1. Get available exercises for trail step
const exercises = await Exercise.findAll({
  where: { trailStepId, type: 'vocabulary_matching' }
});

// 2. Select appropriate exercise based on user progress
const selectedExercise = selectExerciseForUser(exercises, userId);

// 3. Create session linked to specific exercise
const session = await ExerciseSession.create({
  userId,
  exerciseId: selectedExercise.id,
  trailStepId,
  totalQuestions: vocabularyCount
});

// 4. Link shuffled vocabulary to session
await ExerciseSessionVocabulary.bulkCreate(sessionVocabularies);
```

## Usage Workflow

### 1. Initial Setup

```bash
# Create exercises from existing vocabulary data
curl -X POST http://localhost:8080/api/exercises/bulk-create-vocabulary-exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "wordsPerExercise": 10,
    "dryRun": false
  }'
```

### 2. User Exercise Flow

```javascript
// 1. User requests exercises for trail step
GET /api/exercises/trail-step/{trailStepId}

// 2. System creates/resumes session with pre-defined exercise
// Response includes sessionId and vocabulary items

// 3. User submits individual answers
POST /api/exercises/submit-answer
{
  "sessionId": "session-uuid",
  "vocabularyId": "vocab-uuid", 
  "userAnswer": "Olá"
}

// 4. Session completes when all vocabulary answered
// Progress tracked per exercise and overall trail step
```

## Benefits

### **Consistency**
- ✅ All exercises have predictable structure and content
- ✅ Same vocabulary sets provide consistent difficulty progression
- ✅ Unified API patterns across all exercise types

### **Performance** 
- ✅ Pre-computed vocabulary sets eliminate runtime queries
- ✅ Cached exercise content reduces database load
- ✅ Efficient session management with clear boundaries

### **Content Quality**
- ✅ Curated vocabulary groupings ensure pedagogical coherence
- ✅ Balanced exercise difficulty through controlled word selection
- ✅ Consistent vocabulary distribution across exercises

### **User Experience**
- ✅ Predictable exercise length (fixed word count)
- ✅ Progress tracking per individual exercise
- ✅ Ability to retry specific exercises for focused practice

## Maintenance

### Updating Exercises

When vocabulary data changes:

1. **Run bulk creation again** - Safely overwrites existing exercises
2. **Use category filter** - Update specific categories only
3. **Test with dry run** - Preview changes before applying

```bash
# Update exercises for specific category
curl -X POST http://localhost:8080/api/exercises/bulk-create-vocabulary-exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "categoryId": "category-uuid",
    "wordsPerExercise": 12,
    "dryRun": false
  }'
```

### Monitoring

- **Exercise count per trail step** - Ensure adequate content variety
- **Vocabulary distribution** - Verify balanced word allocation across exercises  
- **User completion rates** - Monitor which exercises are too difficult/easy
- **Session abandonment** - Track incomplete sessions for UX improvements

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "No vocabulary exercises found" | Bulk creation not run | Run bulk creation endpoint |
| "No vocabulary found for category" | Empty vocabulary table | Add vocabulary data first |
| "Trail step must be vocabulary_matching" | Wrong trail step type | Only create for vocabulary_matching steps |

### Validation

- **Trail step type** - Only `vocabulary_matching` steps supported
- **Vocabulary availability** - Requires existing vocabulary data
- **Word count limits** - 5-20 words per exercise enforced
- **Category consistency** - Exercises only contain vocabulary from single category

## Future Enhancements

- **Adaptive difficulty** - Adjust vocabulary selection based on user performance
- **Spaced repetition** - Prioritize vocabulary user struggles with
- **Custom exercise creation** - Allow manual curation of vocabulary sets
- **Multi-category exercises** - Support cross-category vocabulary mixing
- **Dynamic exercise generation** - AI-assisted exercise creation from vocabulary patterns