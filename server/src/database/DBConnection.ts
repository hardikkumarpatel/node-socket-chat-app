import { Sequelize } from 'sequelize';
import { LocalEnvironmentConfig } from '../utils/LocalEnv';
import UserModel from '../model/User.Model';
import ChatModel from '../model/Chat.Model';
import ChatParticipentsModel from '../model/Chatparticipant.Model';
import ChatMessageModel from '../model/ChatMessage.model';
const { environmentVariables: { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } } = new LocalEnvironmentConfig();

const sequelize = new Sequelize(
    DB_NAME as string,
    DB_USERNAME as string,
    DB_PASSWORD as string,
    {
        host: DB_HOST as string,
        dialect: 'postgres',
        logging: false,
        schema: 'public',
    },
);
const User = UserModel(sequelize);
const Chat = ChatModel(sequelize);
const ChatParticipents = ChatParticipentsModel(sequelize);
const ChatMessages = ChatMessageModel(sequelize);

Chat.belongsTo(User, { 
    foreignKey: 'sender_id',
    targetKey: 'id',
 })
Chat.hasMany(ChatParticipents, { 
    foreignKey: 'chat_id', 
    as: 'chat_participents'
})
ChatParticipents.belongsTo(Chat, { 
    foreignKey: 'chat_id',
    targetKey: 'id'
})  
ChatParticipents.belongsTo(User,{ 
    foreignKey: 'user_id',
    targetKey: 'id'
})
Chat.hasMany(ChatMessages, {
    foreignKey: 'chat_id', 
    as: 'chat_messages'
})
ChatMessages.belongsTo(Chat, { 
    foreignKey: 'chat_id',
    targetKey: 'id'
})  
ChatMessages.belongsTo(User,{ 
    foreignKey: 'sender_id',
    targetKey: 'id'
})

export default sequelize as Sequelize;