// swagger.js
import swaggerAutogen from 'swagger-autogen';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputFile = resolve(__dirname, './swagger_output.json');
const endpointsFiles = [
  resolve(__dirname, './src/routes/user.routes.js'),
  resolve(__dirname, './src/routes/video.routes.js'),
  resolve(__dirname, './src/routes/*.js')
];

const doc = {
  info: {
    title: 'MERN Backend API',
    description: 'Auto-generated Swagger documentation for your MERN backend',
    version: '1.0.0',
  },
  host: 'localhost:8000',
  schemes: ['http'],
};

const generateDocs = swaggerAutogen({ openapi: '3.0.0' });
generateDocs(outputFile, endpointsFiles, doc);
