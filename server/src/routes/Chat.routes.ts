import { Router } from 'express';
import useAuthHandler from '../middleware/Auth.middleware';
import { addNewParticipentsInGroupChatController, createUserGroupChatController, createUserOneOnOneChatController, deleteGroupChatController, deleteOneonOneChatController, getAllChatByUserController, getGroupChatDetailContainer, getUsersController, leaveGroupChatController, removeParticipentsFromGroupChatController, renameGroupChatController } from '../controller/Chat.controller';
const ChatRoute = Router();

ChatRoute.use(useAuthHandler);
ChatRoute.route("/").get(getAllChatByUserController);
ChatRoute.route("/Users").get(getUsersController);
ChatRoute.route("/CreateChat/:ReceiverID").post(createUserOneOnOneChatController);
ChatRoute.route("/CreateGroupChat").post(createUserGroupChatController);
ChatRoute.route("/GetGroupChatDetails/:ChatID").get(getGroupChatDetailContainer);
ChatRoute.route("/RenameGroupChat/:ChatID").patch(renameGroupChatController);
ChatRoute.route("/DeleteGroupChat/:ChatID").delete(deleteGroupChatController);
ChatRoute.route("/DeleteOneonOneChat/:ChatID").delete(deleteOneonOneChatController);
ChatRoute.route("/LeaveGroupChat/:ChatID").delete(leaveGroupChatController);
ChatRoute.route("/AddGroupChatParticipents/:ChatID/:ParticipantID").post(addNewParticipentsInGroupChatController);
ChatRoute.route("/RemoveGroupChatParticipents/:ChatID/:ParticipantID").post(removeParticipentsFromGroupChatController);


export default ChatRoute;