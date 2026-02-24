import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routers';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline styles for login page
    // Allow images/files from /uploads to be loaded by web app on a different origin/port.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (login page, etc.)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

// Error Handler
app.use(errorHandler);

export default app;
