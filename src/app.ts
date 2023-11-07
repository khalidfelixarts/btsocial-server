import express, { Express } from 'express';

import { startClient } from './setupServer';

import databaseConnection from './setupDatabase';

import { config } from './config';

function initialize(): void {
  loadConfig();
  databaseConnection();
  const app: Express = express();
  startClient(app);
}

function loadConfig(): void {
  config.validateConfig();
  config.cloudinaryConfig();
}

initialize();
