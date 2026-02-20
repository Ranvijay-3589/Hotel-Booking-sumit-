const { createApp } = require('./app');
const { initDb } = require('./db');
const { port } = require('./config');

async function startServer() {
  await initDb();
  const app = createApp();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
