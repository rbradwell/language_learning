# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Management
```bash
# Start database and pgadmin
docker-compose up languagelearningdb pgadmin

# Run all migrations
cd backend && node run-migrations.js
# OR
cd backend && npx sequelize-cli db:migrate

# Run all seeders  
cd backend && npx sequelize-cli db:seed:all

# Reset database completely
cd backend && npx sequelize-cli db:migrate:undo:all
cd backend && npx sequelize-cli db:migrate  
cd backend && npx sequelize-cli db:seed:all

# Verify database
psql -h localhost -U postgres -d languagelearningdb -c "SELECT COUNT(*) as vocabulary_count FROM \"Vocabularies\";"
```

### Backend Development
```bash
cd backend
npm run dev          # Development with nodemon
npm run start        # Production
npm run test         # Run Jest tests
npm run db:migrate   # Run migrations only
npm run db:seed      # Run seeders only
```

### Frontend Development  
```bash
cd frontend
npm run start        # Start Expo development server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run web          # Run in web browser
```

## Architecture Overview

### Database Architecture
The app uses PostgreSQL with Sequelize ORM. The database architecture recently underwent a major simplification:

**Key Change**: Removed redundant `Trails` table. Categories now connect directly to TrailSteps:
- `Categories` → `TrailSteps` (one-to-many)
- `TrailSteps` → Multiple exercise types (one-to-many)

**Core Tables**:
- `Categories`: Learning categories (e.g., "Greetings", "Food & Dining")
- `TrailSteps`: Individual learning steps within categories  
- `Vocabularies`: Words/phrases to learn
- `ExerciseSessions`: Tracks user exercise attempts
- `ExerciseSessionVocabularies`: Junction table for vocabulary exercises

**Exercise Types** (separate tables):
- `VocabularyMatchingExercises`: Multiple choice vocabulary practice
- `SentenceCompletionExercises`: Sentence building exercises
- `FillBlanksExercises`: Fill-in-the-blank exercises with pinyin input

### Exercise System Architecture

**Session Management**: Each exercise attempt creates an `ExerciseSession` that tracks:
- User progress and scoring
- Session state (in_progress, completed, abandoned)
- 24-hour expiration
- Links to specific exercise and trail step

**Vocabulary Matching Flow**:
1. `vocabularyIds` in exercise defines target learning vocabulary
2. Backend adds distractors from same category for question variety
3. Frontend receives ALL vocabulary (target + distractors)
4. Frontend generates questions for all vocabulary sequentially
5. Backend only counts correct answers for target vocabulary toward completion
6. User must master original vocabulary to progress, distractors don't count

### Frontend Architecture  

**React Native + Expo**: Cross-platform mobile app
**Navigation**: React Navigation with stack navigator
**Authentication**: JWT tokens with AuthContext
**Main Flow**: CategoryOverview → TrailSteps → Exercise Games

**Exercise Routing**: `MainScreen.js` contains `TrailStepExercisesScreen` that routes to appropriate exercise component based on `trailStep.type`:
- `vocabulary_matching` → VocabularyMatchingGame
- `sentence_completion` → SentenceCompletionGame  
- `fill_blanks` → FillInTheBlanksGame

### Key Business Logic

**Progress Tracking**: Users must complete ALL exercises in a trail step to unlock the next step. Each exercise type has different completion criteria:
- Vocabulary matching: Must answer all target vocabulary correctly
- Sentence/Fill-blanks: Must achieve percentage-based passing score

**Gamification**: Trail steps displayed as lily pads that users tap to navigate, with visual progress indicators and unlocking mechanics.

## Important Notes

### Recent Migrations
- **Trail Removal**: The `Trails` table was removed. Any code referencing `categoryData.trails` should use `categoryData.trailSteps` instead.
- **VocabularyMatchingExercises Simplification**: Removed `order` and `category` columns, now only one exercise per trail step.

### Model Loading
- `Trail.js` model is deprecated and skipped in `models/index.js`
- Exercise tables have no foreign key constraints on `exerciseId` to support multiple exercise types

### Pinyin Input System
The Fill-in-the-Blanks game includes a sophisticated pinyin IME (Input Method Editor) that:
- Converts pinyin to Chinese characters using vocabulary database
- Shows candidate character options as user types
- Handles tone marks and variations for accurate input

### Development Database
- Uses Docker Compose for PostgreSQL and pgAdmin
- Database name: `languagelearningdb`
- Default credentials in docker-compose.yml
- pgAdmin available at localhost for database inspection