import { Router } from 'express';
import useAuthHandler from '../middleware/Auth.middleware';
import { createUserGroupChatController, createUserOneOnOneChatController, getAllChatByUserController, getUsersController } from '../controller/Chat.controller';
const ChatRoute = Router();

ChatRoute.use(useAuthHandler);
ChatRoute.route("/").get(getAllChatByUserController);
ChatRoute.route("/Users").get(getUsersController);
ChatRoute.route("/CreateChat/:ReceiverID").post(createUserOneOnOneChatController);
ChatRoute.route("/CreateGroupChat").post(createUserGroupChatController);


export default ChatRoute;