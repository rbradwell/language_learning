'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create VocabularyMatchingExercises table
    await queryInterface.createTable('VocabularyMatchingExercises', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      trailStepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TrailSteps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vocabularyIds: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of vocabulary IDs for this exercise'
      },
      instructions: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Match the words with their translations'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Category name for this exercise'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('VocabularyMatchingExercises', ['trailStepId']);
    await queryInterface.addIndex('VocabularyMatchingExercises', ['category']);

    // Migrate existing vocabulary_matching exercises from Exercises table
    const exercises = await queryInterface.sequelize.query(
      `SELECT id, "trailStepId", content, "order", "createdAt", "updatedAt" 
       FROM "Exercises" 
       WHERE type = 'vocabulary_matching'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${exercises.length} vocabulary matching exercises to migrate`);

    // Insert migrated data into new table
    for (const exercise of exercises) {
      const content = exercise.content;
      const vocabularyIds = content.vocabularyIds || [];
      const instructions = content.instructions || 'Match the words with their translations';
      const category = content.category || 'Unknown';

      await queryInterface.sequelize.query(
        `INSERT INTO "VocabularyMatchingExercises" 
         (id, "trailStepId", "vocabularyIds", instructions, category, "order", "createdAt", "updatedAt")
         VALUES (:id, :trailStepId, :vocabularyIds, :instructions, :category, :order, :createdAt, :updatedAt)`,
        {
          replacements: {
            id: exercise.id, // Keep same ID for FK relationships
            trailStepId: exercise.trailStepId,
            vocabularyIds: JSON.stringify(vocabularyIds),
            instructions: instructions,
            category: category,
            order: exercise.order,
            createdAt: exercise.createdAt,
            updatedAt: exercise.updatedAt
          }
        }
      );
    }

    console.log(`Migrated ${exercises.length} vocabulary matching exercises to new table`);

    // First, temporarily disable foreign key constraints
    await queryInterface.sequelize.query('SET session_replication_role = replica;');

    // Update foreign key references from ExerciseSessions to point to VocabularyMatchingExercises
    const exerciseSessionsUpdated = await queryInterface.sequelize.query(`
      UPDATE "ExerciseSessions" 
      SET "exerciseId" = "VocabularyMatchingExercises"."id"
      FROM "VocabularyMatchingExercises", "Exercises"
      WHERE "ExerciseSessions"."exerciseId" = "Exercises"."id" 
      AND "Exercises"."type" = 'vocabulary_matching'
      AND "VocabularyMatchingExercises"."id" = "Exercises"."id"
    `);

    // Update UserAnswers that reference vocabulary_matching exercises
    const userAnswersUpdated = await queryInterface.sequelize.query(`
      UPDATE "UserAnswers" 
      SET "exerciseId" = "VocabularyMatchingExercises"."id"
      FROM "VocabularyMatchingExercises", "Exercises"
      WHERE "UserAnswers"."exerciseId" = "Exercises"."id" 
      AND "Exercises"."type" = 'vocabulary_matching'
      AND "VocabularyMatchingExercises"."id" = "Exercises"."id"
    `);

    console.log('Updated foreign key references to point to VocabularyMatchingExercises');

    // Remove vocabulary_matching exercises from Exercises table
    await queryInterface.sequelize.query(
      `DELETE FROM "Exercises" WHERE type = 'vocabulary_matching'`
    );

    // Re-enable foreign key constraints
    await queryInterface.sequelize.query('SET session_replication_role = DEFAULT;');

    console.log('Removed vocabulary_matching exercises from Exercises table');
  },

  down: async (queryInterface, Sequelize) => {
    // Migrate data back to Exercises table
    const vocabExercises = await queryInterface.sequelize.query(
      `SELECT id, "trailStepId", "vocabularyIds", instructions, category, "order", "createdAt", "updatedAt" 
       FROM "VocabularyMatchingExercises"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${vocabExercises.length} vocabulary matching exercises to migrate back`);

    // Insert back into Exercises table
    for (const exercise of vocabExercises) {
      const content = {
        vocabularyIds: JSON.parse(exercise.vocabularyIds),
        instructions: exercise.instructions,
        category: exercise.category
      };

      await queryInterface.sequelize.query(
        `INSERT INTO "Exercises" 
         (id, "trailStepId", type, content, "order", "createdAt", "updatedAt")
         VALUES (:id, :trailStepId, :type, :content, :order, :createdAt, :updatedAt)`,
        {
          replacements: {
            id: exercise.id,
            trailStepId: exercise.trailStepId,
            type: 'vocabulary_matching',
            content: JSON.stringify(content),
            order: exercise.order,
            createdAt: exercise.createdAt,
            updatedAt: exercise.updatedAt
          }
        }
      );
    }

    // Update foreign key references back to Exercises table
    await queryInterface.sequelize.query(`
      UPDATE "ExerciseSessions" 
      SET "exerciseId" = "Exercises"."id"
      FROM "Exercises", "VocabularyMatchingExercises"
      WHERE "ExerciseSessions"."exerciseId" = "VocabularyMatchingExercises"."id" 
      AND "Exercises"."type" = 'vocabulary_matching'
      AND "VocabularyMatchingExercises"."id" = "Exercises"."id"
    `);

    await queryInterface.sequelize.query(`
      UPDATE "UserAnswers" 
      SET "exerciseId" = "Exercises"."id"
      FROM "Exercises", "VocabularyMatchingExercises"
      WHERE "UserAnswers"."exerciseId" = "VocabularyMatchingExercises"."id" 
      AND "Exercises"."type" = 'vocabulary_matching'
      AND "VocabularyMatchingExercises"."id" = "Exercises"."id"
    `);

    console.log('Updated foreign key references back to Exercises table');

    // Drop the VocabularyMatchingExercises table
    await queryInterface.dropTable('VocabularyMatchingExercises');

    console.log('Rolled back vocabulary matching exercises migration');
  }
};