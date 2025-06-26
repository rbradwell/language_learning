npx sequelize-cli db:seed:all

lsof -ti:5000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

---

FLOW

Register
Login
Get Exercises By Trail Steps Progress (find first unlocked exercise)
Start Exercise

# In your backend directory
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all

delete from  public."ExerciseSessions";
delete from  public."ExerciseSessionVocabularies";
delete from  public."UserAnswers";