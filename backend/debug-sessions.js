#!/usr/bin/env node

const { ExerciseSession, User } = require('./models');

(async () => {
  try {
    console.log('=== CHECKING ACTIVE EXERCISE SESSIONS ===\n');
    
    // Get all active sessions
    const activeSessions = await ExerciseSession.findAll({
      where: {
        status: 'in_progress'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${activeSessions.length} active sessions:\n`);
    
    const now = new Date();
    activeSessions.forEach((session, i) => {
      const isExpired = now > session.expiresAt;
      const timeLeft = session.expiresAt - now;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`${i + 1}. Session ID: ${session.id}`);
      console.log(`   User: ${session.user?.email || 'Unknown'}`);
      console.log(`   Exercise ID: ${session.exerciseId}`);
      console.log(`   Trail Step ID: ${session.trailStepId}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Score: ${session.score}/${session.totalQuestions}`);
      console.log(`   Created: ${session.createdAt.toISOString()}`);
      console.log(`   Expires: ${session.expiresAt.toISOString()}`);
      console.log(`   ${isExpired ? '❌ EXPIRED' : `✅ ${hoursLeft}h ${minutesLeft}m remaining`}`);
      console.log('');
    });
    
    // Check for recently expired sessions
    const recentlyExpired = await ExerciseSession.findAll({
      where: {
        status: 'in_progress',
        expiresAt: {
          [require('sequelize').Op.lt]: now
        }
      },
      limit: 5,
      order: [['expiresAt', 'DESC']]
    });
    
    if (recentlyExpired.length > 0) {
      console.log(`\n=== RECENTLY EXPIRED SESSIONS (${recentlyExpired.length}) ===`);
      recentlyExpired.forEach((session, i) => {
        const expiredAgo = now - session.expiresAt;
        const hoursAgo = Math.floor(expiredAgo / (1000 * 60 * 60));
        const minutesAgo = Math.floor((expiredAgo % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log(`${i + 1}. Session ${session.id} - expired ${hoursAgo}h ${minutesAgo}m ago`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();