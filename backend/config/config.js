require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'languagelearningdb',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ||5432,
    dialect: 'postgres',
    logging: console.log, // Enable SQL logging in development
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
