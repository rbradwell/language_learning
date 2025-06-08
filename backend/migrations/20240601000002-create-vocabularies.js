// backend/migrations/20240601000002-create-vocabularies.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vocabularies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nativeWord: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetWord: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pronunciation: {
        type: Sequelize.STRING
      },
      difficulty: {
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

    await queryInterface.addIndex('Vocabularies', ['categoryId']);
    await queryInterface.addIndex('Vocabularies', ['difficulty']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vocabularies');
  }
};
