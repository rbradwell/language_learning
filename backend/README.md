npx sequelize-cli db:seed:all

lsof -ti:5000 | xargs kill -9
lsof -ti:8080 | xargs kill -9