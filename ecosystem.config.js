module.exports = {
  apps: [
    {
      name: 'hotel-booking',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
      },
    },
  ],
};
