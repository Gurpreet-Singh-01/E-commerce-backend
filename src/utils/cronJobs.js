const cron = require('node-cron');
const User = require('../models/User.model');

const cleanupUnverifiedUsers = () => {
  cron.schedule('0 0 * * *', async () => { 
    try {
      const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, 
      });
      console.log(`Cleanup completed: ${result.deletedCount} unverified users deleted`);
    } catch (error) {
      console.error('Error cleaning up unverified users:', error);
    }
  }, {
    timezone: 'Asia/Kolkata' 
  });
};

module.exports = { cleanupUnverifiedUsers };