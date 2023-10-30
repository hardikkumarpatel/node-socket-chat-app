import { Sequelize, DataTypes } from 'sequelize';
import { LOGIN_TYPE, USER_ROLE } from '../constant/User.constant';

const UserModel = (sequelize: Sequelize) => {
  const UserModelInstance = sequelize.define('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: USER_ROLE.USER,
    },
    login_type: {
      type: DataTypes.STRING,
      defaultValue: LOGIN_TYPE.EMAIL_PASSWORD,
    },
    avatar_url: {
      type: DataTypes.STRING,
      defaultValue: 'https://via.placeholder.com/200x200.png',
    },
    refresh_token: {
      type: DataTypes.STRING,
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
    },
    deleted_at: {
      type: DataTypes.DATE,
    }
  }, {
    timestamps: false
  });
  UserModelInstance.sync({ alter: true });
  return UserModelInstance;
};

export default UserModel;