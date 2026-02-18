module.exports = {
  apps: [{
    name: 'hotel-booking',
    script: 'server/index.js',
    cwd: '/home/cmdcmd007/projects/book-hotel',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '256M',
  }]
};
