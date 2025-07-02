'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Categories', 'iconPath', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to the category icon component'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Categories', 'iconPath');
  }
};