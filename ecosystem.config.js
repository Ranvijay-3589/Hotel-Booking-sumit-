module.exports = {
  apps: [
    {
      name: 'hotel-booking',
      script: 'server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
      },
    },
  ],
};
