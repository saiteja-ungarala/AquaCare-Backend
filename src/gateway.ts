import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routers';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error Handler
app.use(errorHandler);

export default app;
