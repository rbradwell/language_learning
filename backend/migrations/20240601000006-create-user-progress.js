'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserProgresses', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completionTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('UserProgresses', ['userId']);
    await queryInterface.addIndex('UserProgresses', ['trailStepId']);
    await queryInterface.addIndex('UserProgresses', ['completed']);
    
    // Unique constraint to prevent duplicate user progress for same step
    await queryInterface.addConstraint('UserProgresses', {
      fields: ['userId', 'trailStepId'],
      type: 'unique',
      name: 'unique_user_trail_step'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserProgresses');
  }
};
