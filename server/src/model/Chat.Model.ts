import { Sequelize, DataTypes } from 'sequelize';
import ChatParticipentsModel from './Chatparticipant.Model';

const ChatModel = (sequelize: Sequelize) => {
  const ChatModelInstance = sequelize.define('chat', 
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_group_chat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: true
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: new Date()
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: new Date()
    },
    deleted_at: {
      type: DataTypes.DATE,
    }
  }, {
    timestamps: false
  },
  );
  ChatModelInstance.sync({ alter: true });
//   ChatModelInstance.hasMany(ChatParticipentsModel(sequelize), {
//     foreignKey: 'user_id'
//   });
//   ChatParticipentsModel(sequelize).belongsTo(ChatModelInstance);
  return ChatModelInstance;
};

export default ChatModel;