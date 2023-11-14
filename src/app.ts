import express, { Express } from 'express';
import { startClient } from './setupServer';
import databaseConnection from './setupDatabase';
import { config } from './config';
import Logger from 'bunyan';
const log: Logger = config.createLogger('server');

function initialize(): void {
  loadConfig();
  databaseConnection();
  const app: Express = express();
  startClient(app);
  handleExit();
}

function loadConfig(): void {
  config.validateConfig();
  config.cloudinaryConfig();
}

////////////////// HANDLING PROCESS EXCEPTIONS ////////////////
function handleExit(): void {
  process.on('uncaughtException', (error: Error) => {
    log.error(`There was an uncaught error: ${error}`);
    shutDownProperly(1);
  });

  process.on('unhandleRejection', (reason: Error) => {
    log.error(`Unhandled rejection at promise: ${reason}`);
    shutDownProperly(2);
  });

  process.on('SIGTERM', () => {
    log.error('Caught SIGTERM');
    shutDownProperly(2);
  });

  process.on('SIGINT', () => {
    log.error('Caught SIGINT');
    shutDownProperly(2);
  });

  process.on('exit', () => {
    log.error('Exiting');
  });
}

////// FUNCTION TO SHUTDOWN /////////
function shutDownProperly(exitCode: number): void {
  Promise.resolve()
    .then(() => {
      log.info('Shutdown complete');
      process.exit(exitCode);
    })
    .catch((error) => {
      log.error(`Error during shutdown: ${error}`);
      process.exit(1);
    });
}

initialize();
