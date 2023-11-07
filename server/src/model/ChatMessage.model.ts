import { Sequelize, DataTypes } from 'sequelize';

const ChatMessageModel = (sequelize: Sequelize) => {
  const ChatMessageModelInstance = sequelize.define('messages', 
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sender_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: false
    },
    chat_id: {
      type: DataTypes.UUID,
      references: {
        model: 'chats',
        key: 'id'
      },
      allowNull: false
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
  ChatMessageModelInstance.sync({ alter: true });
  return ChatMessageModelInstance;
};

export default ChatMessageModel;