import { Router } from 'express';
import useAuthHandler from '../middleware/Auth.middleware';
import { createUserOneOnOneChatController, getUsersController } from '../controller/Chat.controller';
const ChatRoute = Router();

ChatRoute.use(useAuthHandler);
ChatRoute.route("/Users").get(getUsersController);
ChatRoute.route("/CreateChat/:ReceiverID").post(createUserOneOnOneChatController);

export default ChatRoute;