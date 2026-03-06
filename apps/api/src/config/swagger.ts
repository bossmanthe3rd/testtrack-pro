// apps/api/src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0', // The version of the OpenAPI specification we are using
    info: {
      title: 'TestTrack Pro API',
      version: '1.0.0',
      description: 'API documentation for the TestTrack Pro software testing platform',
    },
    servers: [
      {
        url: 'http://localhost:5000', // Change this if your backend runs on a different port
        description: 'Development server',
      },
    ],
    // This tells Swagger how we handle authentication (JWT Tokens)
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // This tells Swagger where to look for your documentation comments
  // This tells Swagger to scan EVERY file ending in .routes.ts or .controller.ts inside the src folder
  apis: [
    './src/**/*.routes.ts', 
    './src/**/*.controller.ts'
  ], 
};

export const swaggerSpec = swaggerJsdoc(options);