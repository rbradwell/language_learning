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
