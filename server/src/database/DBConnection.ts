// import { Sequelize } from 'sequelize';
// import { LocalEnvironmentConfig } from '../Utils/LocalEnv';
// import { DatabaseModelInterface } from '../interface/Model/DBModelInterface';
// import UserModel from '../model/User.Model';
// const { environmentVariables: { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } } = new LocalEnvironmentConfig();

// let DB: Sequelize;
// const initDatabase = async () => {
//     return new Promise<Sequelize>(resolve => {
//         const sequelize = new Sequelize(
//             DB_NAME as string,
//             DB_USERNAME as string,
//             DB_PASSWORD as string,
//             {
//                 host: DB_HOST as string,
//                 dialect: 'postgres',
//                 logging: false,
//                 schema: 'public',
//             },
//         );
//         UserModel(sequelize);

//         sequelize.sync()
//             .then(() => {
//                 console.log('Sequelize database has been connected and intialized!');
//                 DB = (sequelize);
//                 resolve(sequelize);
//             })
//             .catch((DBException: Error) => {
//                 console.error('Error occured during database initialization', DBException);
//                 process.exit(1);
//             });
//     })

// }

// export default initDatabase;


import { Sequelize } from 'sequelize';
import { LocalEnvironmentConfig } from '../utils/LocalEnv';
import UserModel from '../model/User.Model';
import ChatModel from '../model/Chat.Model';
import ChatParticipentsModel from '../model/Chatparticipant.Model';
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
Chat.belongsTo(User, { foreignKey: 'admin' })
Chat.belongsTo(ChatParticipents, { foreignKey: 'id' })
ChatParticipents.belongsTo(User, { foreignKey: 'user_id' })  
ChatParticipents.belongsTo(Chat,{foreignKey: 'chat_id'})

export default sequelize as Sequelize;