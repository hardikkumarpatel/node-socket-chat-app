import { Router } from 'express';
import useAuthHandler from '../middleware/Auth.middleware';
import { getMessageController, sendMessageController } from '../controller/Message.controller';
const MessageRoute = Router();

MessageRoute.use(useAuthHandler);
MessageRoute.route("/SendMessage/:ChatID").post(sendMessageController);
MessageRoute.route("/GetMessage/:ChatID").get(getMessageController);

export default MessageRoute;