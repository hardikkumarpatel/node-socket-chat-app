import { Router } from 'express';
import UserRoute from './User.routes';
import ChatRoute from './Chat.routes';
const RootRoutes = Router();

RootRoutes.use("/Users", UserRoute);
RootRoutes.use("/Chat", ChatRoute);

export default RootRoutes;