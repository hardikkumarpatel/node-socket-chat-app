import { Sequelize, DataTypes } from 'sequelize';

const ChatParticipentsModel = (sequelize: Sequelize) => {
  const ChatParticipentsModelInstance = sequelize.define('chat_participents', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chat_id: {
        type: DataTypes.UUID,
        references: {
          model: 'chats',
          key: 'id'
        },
        allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: false
    }
  }, {
    timestamps: false
  });
  ChatParticipentsModelInstance.sync({ alter: true });
  return ChatParticipentsModelInstance;
};

export default ChatParticipentsModel;