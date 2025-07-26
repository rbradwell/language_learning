# language_learning
language learning app


docker-compose up languagelearningdb pgadmin

# 3. Install Sequelize CLI if needed
npm install -g sequelize-cli

# 4. Create database
npx sequelize-cli db:create

# 5. Run migrations (creates tables)
npx sequelize-cli db:migrate

# 6. Run seeders (populates data)
npx sequelize-cli db:seed:all

# 7. Verify it worked
psql -h localhost -U postgres -d languagelearningdb -c "SELECT COUNT(*) as vocabulary_count FROM \"Vocabularies\";"

docker exec $(docker-compose ps -q languagelearningdb) pg_isready -U postgres

---

# 1. Reset migrations
npx sequelize-cli db:migrate:undo:all

# 3. Run migrations (creates tables)
npx sequelize-cli db:migrate

# 4. Run seeders (populates data)
npx sequelize-cli db:seed:all

---


⏺ Vocabulary matching exercises work as follows:

  Game Flow

  1. Exercise Selection: Finds the next vocabulary_matching exercise in a trail step that hasn't been completed successfully
  2. 3-Second Countdown: Visual countdown before the game starts
  3. Question Generation: Creates multiple-choice questions from vocabulary data
  4. Answer Submission: User selects answers and receives immediate feedback
  5. Progression: Advances to next question only after correct answer

  Question Structure

  - Question Format: Shows the native language word (e.g., English "hello")
  - Answer Options: 4 multiple-choice options showing target language with pronunciation
    - Example: 你好 (nǐ hǎo), 再见 (zàijiàn), etc.
  - Correct Answer: The target language translation of the native word
  - Distractors: 3 incorrect options randomly selected from other vocabulary in the exercise

  Data Model

  - VocabularyMatchingExercises table stores:
    - vocabularyIds: JSON array of vocabulary IDs for the exercise
    - trailStepId: Links to specific trail step
    - instructions: Exercise instructions
    - category: Category name for context

  Exercise Session Management

  - Creates ExerciseSession when exercise starts
  - Tracks answers, score, and completion status
  - Must answer correctly to advance (no skipping incorrect answers)
  - Session completes when all vocabulary items answered correctly

  Feedback System

  - Correct: Green visual feedback, no vibration, advances to next question
  - Incorrect: Red visual feedback, vibration, stays on same question
  - Scoring: Backend calculates and returns current score

  The exercises use vocabulary from the Vocabularies table filtered by category, ensuring learners practice words relevant to their current learning focus (e.g., "Greetings",
  "Food & Dining").


  ⏺ Purpose of ExerciseSession and ExerciseSessionVocabulary Tables

  ExerciseSession Table

  The ExerciseSession table is the core session management system that tracks every user's exercise attempt:

  Primary Functions:
  1. Session State Management: Tracks if an exercise is 'in_progress', 'completed', or 'abandoned'
  2. Score Tracking: Records current score (correct answers) out of total questions
  3. User Progress: Links users to their exercise attempts across all exercise types
  4. Session Lifecycle: Manages 24-hour expiration and prevents duplicate sessions
  5. Analytics Foundation: Provides data for calculating trail step completion and user progress

  Key Features:
  - Supports multiple exercise types (vocabulary matching, sentence completion, fill-in-blanks)
  - Handles session resumption for incomplete exercises
  - Tracks completion timestamps for progress analytics
  - Denormalizes trailStepId for efficient querying

  ExerciseSessionVocabulary Table

  This is a junction table specifically for vocabulary matching exercises:

  Primary Functions:
  1. Vocabulary Linking: Connects which specific vocabulary words are included in each exercise session
  2. Duplicate Prevention: Unique constraint ensures no vocabulary word appears twice in same session
  3. Session Isolation: Allows different sessions to have different vocabulary sets
  4. Exercise Content Tracking: Records exactly which words a user practiced

  Key Features:
  - Only used for vocabulary_matching exercise type
  - Simple many-to-many relationship between sessions and vocabulary
  - Enables vocabulary-specific analytics and progress tracking
  - Supports personalized exercise content selection

  Why This Architecture?

  - Flexibility: ExerciseSession works across all exercise types while ExerciseSessionVocabulary handles vocabulary-specific needs
  - Progress Tracking: System can determine trail step completion by checking if all exercise sessions are completed
  - Session Management: Prevents users from having multiple active sessions and handles resumption
  - Analytics: Provides detailed data for user progress, category completion, and learning analytics

  The tables work together to create a comprehensive exercise tracking system that supports the gamified learning progression through trail steps and categories.

--

> how does the vocabulary matching exercise use the vocabularyIds in the VocabularyMatchingExercises table

⏺ Task(Analyze vocabulary matching flow)
  ⎿  Done (7 tool uses · 47.4k tokens · 1m 10.6s)                                                                                                                                 

⏺ How VocabularyIds are used in Vocabulary Matching Exercises

  The vocabularyIds field in the VocabularyMatchingExercises table serves as the core learning curriculum for each exercise. Here's the complete flow:

  1. Exercise Definition (VocabularyMatchingExercises Table)

  // Example vocabularyIds stored as JSON array
  vocabularyIds: ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
  This defines exactly which vocabulary words the user must master to complete the exercise.

  2. Exercise Session Creation (Backend)

  When a user starts the exercise:

  Step 1: Fetch Target Vocabulary
  // Get the specific vocabulary items from vocabularyIds
  const vocabularyIds = exercise.vocabularyIds || [];
  vocabularyData = await Vocabulary.findAll({
    where: { id: vocabularyIds },
    include: [{ model: Category, attributes: ['id', 'name', 'language'] }],
    order: [['difficulty', 'ASC'], ['id', 'ASC']]
  });

  Step 2: Add Distractors if Needed
  // If < 4 vocabulary items, fetch additional ones from same category as distractors
  if (vocabularyData.length < MIN_VOCABULARY_NEEDED) {
    const additionalVocab = await Vocabulary.findAll({
      where: { id: { [Op.notIn]: vocabularyIds } }, // Exclude original IDs
      // ... fetch more vocabulary for distractors
    });
    vocabularyData = [...vocabularyData, ...additionalVocab];
  }

  Step 3: Track Original Vocabulary Only
  // Link session to ONLY the original vocabularyIds (not distractors)
  const sessionVocabularyData = vocabularyIds.map(vocabId => ({
    sessionId: session.id,
    vocabularyId: vocabId
  }));
  await ExerciseSessionVocabulary.bulkCreate(sessionVocabularyData);

  3. Frontend Question Generation

  The frontend receives ALL vocabulary (original + distractors) but generates questions sequentially:

  const generateQuestion = (vocabulary, questionIndex) => {
    const currentVocab = vocabulary[questionIndex]; // Could be original or distractor
    const correctAnswer = currentVocab.targetWord;

    // Create 4-option multiple choice with 3 random distractors
    const otherVocabItems = vocabulary.filter((_, index) => index !== questionIndex);
    const distractorItems = shuffledDistractors.slice(0, 3);
    const allOptions = [currentVocab, ...distractorItems];
  }

  4. Scoring Logic (Backend)

  The key insight: Only answers to original vocabularyIds count toward completion

  // Session has totalQuestions = vocabularyIds.length (NOT total vocabulary sent)
  if (isCorrect) {
    await session.increment('score'); // Only for original vocabulary items
  }

  // Complete when user masters all original vocabulary
  if (session.score >= session.totalQuestions) {
    await session.update({ status: 'completed' });
  }

  5. Practical Example

  Exercise Setup:
  - VocabularyMatchingExercise has vocabularyIds: ["hello-id", "goodbye-id", "please-id"]
  - System adds 2 distractors: "thank you" and "excuse me"
  - Frontend receives 5 vocabulary items total

  Question Flow:
  1. Question 1: "hello" (original) → correct answer counts toward completion
  2. Question 2: "thank you" (distractor) → correct answer doesn't count toward score
  3. Question 3: "goodbye" (original) → correct answer counts toward completion
  4. Question 4: "excuse me" (distractor) → correct answer doesn't count toward score
  5. Question 5: "please" (original) → correct answer counts toward completion

  Completion:
  - User must answer 3/5 questions correctly (the original vocabulary items)
  - Score reaches 3, session completes
  - User has mastered the intended learning objectives

  Why This Design?

  1. Clear Learning Objectives: vocabularyIds defines exactly what must be learned
  2. Rich Question Variety: Additional distractors provide diverse multiple-choice options
  3. Accurate Progress Tracking: Only mastery of intended vocabulary counts toward advancement
  4. Scalable Content: Can add more distractors without changing completion requirements

  The vocabularyIds field essentially creates a contract - these are the specific words a user must demonstrate knowledge of to pass the exercise, regardless of how many
  additional vocabulary items are used to create engaging questions.

> so your saying that N vocabularyIds are passed to the front-end then it will generate N questions?  How does it know the correct answer?

⏺ You've identified a key point in my explanation that needs clarification! Let me trace through the actual code more carefully.

⏺ Read(VocabularyMatchingGame.js)
  ⎿  Read 50 lines (ctrl+r to expand)

⏺ Read(VocabularyMatchingGame.js)
  ⎿  Read 50 lines (ctrl+r to expand)

⏺ Read(VocabularyMatchingGame.js)
  ⎿  Read 30 lines (ctrl+r to expand)

⏺ You're absolutely right to question this! Looking at the actual code, I need to correct my explanation:

  How Questions are Actually Generated

  You're correct to be confused - my previous explanation was misleading. Here's what actually happens:

  1. Frontend Receives ALL Vocabulary

  - Backend sends ALL vocabulary (original vocabularyIds + distractors) to frontend
  - Frontend receives, say, 8 vocabulary items total (3 original + 5 distractors)

  2. Frontend Generates Questions Sequentially Through ALL Vocabulary

  const generateQuestion = (vocabulary, questionIndex, incorrectSet) => {
    const currentVocab = vocabulary[questionIndex]; // Could be any vocabulary item
    const correctAnswer = currentVocab.targetWord;
  }

  Key Point: The frontend generates questions for ALL vocabulary items it receives, not just the original vocabularyIds. So if there are 8 vocabulary items total, it will
  generate 8 questions.

  3. How Does It Know the Correct Answer?

  Simple: Each vocabulary object contains the complete data:
  const currentVocab = vocabulary[questionIndex];
  // currentVocab has: { id, nativeWord, targetWord, pronunciation, etc. }
  const correctAnswer = currentVocab.targetWord;

  The correct answer is always the targetWord of whichever vocabulary item is being questioned. Whether it's from the original vocabularyIds or a distractor doesn't matter for
  question generation.

  4. The Backend Determines What Counts for Scoring

  The crucial part happens when an answer is submitted:

  // Frontend sends: vocabularyId, userAnswer
  // Backend checks: Is this vocabularyId in the original exercise vocabularyIds?

  In the backend's submit-answer logic:
  - If the vocabularyId being answered is from the original vocabularyIds, the correct answer counts toward session completion
  - If the vocabularyId is a distractor, the correct answer doesn't count toward completion

  5. Corrected Flow Example

  Exercise Setup:
  - Original vocabularyIds: ["hello-id", "goodbye-id", "please-id"] (3 items)
  - Backend adds distractors: ["thanks-id", "sorry-id"] (2 items)
  - Frontend receives 5 vocabulary items total
  - totalQuestions = 3 (only original vocabularyIds count)

  Question Generation:
  1. Question 1: "hello" (original) → correct answer: "你好"
  2. Question 2: "thanks" (distractor) → correct answer: "谢谢"
  3. Question 3: "goodbye" (original) → correct answer: "再见"
  4. Question 4: "sorry" (distractor) → correct answer: "对不起"
  5. Question 5: "please" (original) → correct answer: "请"

  Scoring:
  - User answers Questions 1, 3, 5 correctly → score = 3/3 → exercise complete
  - Questions 2, 4 don't count toward completion even if answered correctly

  Summary

  - Frontend: Generates questions for ALL vocabulary, knows correct answer from vocabulary object
  - Backend: Only counts correct answers for original vocabularyIds toward session completion
  - User Experience: Must go through all questions, but only original vocabulary mastery determines progress

  The frontend doesn't need to know which vocabulary items are "original" vs "distractors" - it just presents all questions. The backend handles the scoring logic to ensure only intended learning objectives count toward advancement.