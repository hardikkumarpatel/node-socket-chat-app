import sequelize from "../database/DBConnection";
const { models: { users: UserModel, chat: ChatModel, chat_participents: ChatParticipentsModel } } = sequelize;

const getUserOneonOneChatDetails = async (chatWhereRequests: {}, chatParticipentsWhereRequest: {}) => {
    return await ChatModel.findOne({
        where: {
            ...chatWhereRequests,
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    ...chatParticipentsWhereRequest
                },
                attributes: {
                    exclude: ['created_at', 'updated_at', 'deleted_at'],
                },
                include: [{
                    model: UserModel,
                    attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
                }]
            },
        ],
    });
}

export { getUserOneonOneChatDetails }