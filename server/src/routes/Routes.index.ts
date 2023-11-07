import { Router } from 'express';
import UserRoute from './User.routes';
import ChatRoute from './Chat.routes';
import MessageRoute from './Message.routes';
const RootRoutes = Router();

RootRoutes.use("/Users", UserRoute);
RootRoutes.use("/Chat", ChatRoute);
RootRoutes.use("/Message", MessageRoute);

export default RootRoutes;