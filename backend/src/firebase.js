process.env.DREAM_STORE ||= 'firestore';

const { onRequest } = require('firebase-functions/v2/https');
const { app } = require('./server');

exports.api = onRequest(
  {
    region: process.env.FUNCTION_REGION || 'us-central1',
    maxInstances: Number(process.env.FUNCTION_MAX_INSTANCES || 2),
  },
  app
);
