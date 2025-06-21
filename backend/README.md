npx sequelize-cli db:seed:all

lsof -ti:5000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

---

FLOW

Register
Login
Get Exercises By Trail Steps Progress (find first unlocked exercise)
Start Exercise

