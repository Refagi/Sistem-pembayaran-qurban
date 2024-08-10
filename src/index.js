const app = require('./app');
const prisma = require('../prisma/index');
const config = require('./config/config');

// Ambil port dari variabel lingkungan PORT, jika tidak ada gunakan port default dari config
const PORT = process.env.PORT || config.port;

let server;

if (prisma) {
  console.log('Connected to Database');
  server = app.listen(config.port, () => {
    console.log(`Listening to port ${config.port}`);
  });
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.log(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});
