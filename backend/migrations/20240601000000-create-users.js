// backend/migrations/20240601000000-create-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      nativeLanguage: {
        type: Sequelize.STRING,
        defaultValue: 'English'
      },
      targetLanguage: {
        type: Sequelize.ENUM('Mandarin', 'Portuguese'),
        allowNull: false
      },
      totalScore: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      level: {
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

    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['username']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};