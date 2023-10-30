import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer, Server } from 'http';
import { LocalEnvironmentConfig } from './utils/LocalEnv';
import { SockerServer } from './Socket';
import Morgan from 'morgan';
import CORS from 'cors'
import sequelize from './database/DBConnection';
import { Sequelize } from 'sequelize';
import RootRoutes from './Routes/Routes.index';
import useErrorHandler from './middleware/Error.middleware';
const { environmentVariables: { PORT } } = new LocalEnvironmentConfig();

class AppServer {
    public app: express.Application;
    public server: Server;
    constructor() {
        void this.startServer();
    }

    private startServer = async (): Promise<void> => {
        this.app = express();
        await this.intiDB();
        void this.initiMiddleware();
        void this.initRoutes();
        void this.initSocketEngine();
        Promise.resolve(this.server.listen(PORT, () => console.log("Server is running on PORT", PORT)))
    }

    private intiDB = async (): Promise<void | Sequelize> => {
        return new Promise<Sequelize>(resolve => {
            sequelize.sync()
                .then((con) => {
                    console.log('Sequelize database has been connected and initialized!');
                    resolve(con);
                })
                .catch((DBException: Error) => {
                    console.error('Error occured during database initialization', DBException);
                    process.exit(1);
                });
        })

    }

    private initiMiddleware = (): void => {
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json({ limit: '6kb' }));
        this.app.use(Morgan('dev'));
        this.app.use(CORS({
            origin: '*',
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
        }));
    }

    private initSocketEngine = (): void => {
        this.server = createServer(this.app);
        const IO: SockerServer = new SockerServer(this.server);
        this.app.set('IO', IO);
    }

    private initRoutes = (): void => {
        this.app.use("/api/v1", RootRoutes)
        this.app.use(useErrorHandler)
    }
}

export default new AppServer;
