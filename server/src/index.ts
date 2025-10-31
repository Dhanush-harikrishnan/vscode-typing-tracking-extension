import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { DatabaseConfig } from './config/database.config';
import activityRoutes from './routes/activity.routes';

// Load environment variables
dotenv.config();

/**
 * Main server application
 */
class Server {
  private app: Application;
  private port: number;
  private dbConfig: DatabaseConfig;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.dbConfig = DatabaseConfig.getInstance();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middlewares
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    const allowedOrigins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map(origin => origin.trim());
    
    this.app.use(
      cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check route
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'VS Code Typing Tracker API',
        version: '1.0.0',
        status: 'running',
      });
    });

    // API routes
    this.app.use('/api', activityRoutes);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    });
  }

  /**
   * Connect to database and start server
   */
  public async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await this.dbConfig.connect();

      // Start Express server
      this.app.listen(this.port, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║  🚀 VS Code Typing Tracker Server Started   ║
╠══════════════════════════════════════════════╣
║  Port:        ${this.port}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database:    MongoDB Connected ✅           ║
╚══════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down server...');
    try {
      await this.dbConfig.disconnect();
      console.log('✅ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  void server.shutdown();
});

process.on('SIGINT', () => {
  void server.shutdown();
});

// Start server
void server.start();

export default server;
