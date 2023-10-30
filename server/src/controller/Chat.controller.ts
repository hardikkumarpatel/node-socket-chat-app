import { Response, NextFunction } from 'express';
import asyncHander from '../helper/AsyncHandler.helper';
import { CustomRequest } from '../helper/CommonHandler';
import sequelize from '../database/DBConnection';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import ApiResponseHandler from '../utils/ApiResponseHandler';
import ApiErrorHandler from '../utils/ApiErrorHandler';
import { UserDTO } from '../interface/User.interface';
const { models: { users: UserModel, chat: ChatModel, chat_participents: ChatParticipentsModel } } = sequelize;

const getUsersController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.user;
    const getUsers = await UserModel.findAll(
        {
            where: { id: { [Op.notIn]: [id] } },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        });
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Users fetched successfully", { users: getUsers }))
});

const createUserOneOnOneChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ReceiverID }, user: { id: senderUserID }} = req;
    if(!ReceiverID) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, 'Receiver ID is required');
    }

    const getReceiverUser = await UserModel.findOne({ where: { id: ReceiverID }});
    if(!getReceiverUser) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, 'Receiver does not exists');
    }

    const { id } = getReceiverUser.dataValues as UserDTO;
    if(id === senderUserID) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "You can't send message to yourself");
    }

    const createChat = await ChatModel.create({
        name: 'One on one chat',
        admin: senderUserID,
        is_group_chat: false
    });
    // console.log("createChat", createChat.dataValues)
    if(createChat) {
        [ReceiverID, senderUserID].forEach(async (ID) => {
            await ChatParticipentsModel.create({
                chat_id: createChat.dataValues.id,
                user_id: ID
            })
        })
    }
    const c = await ChatModel.findOne(
        { where: { id: createChat.dataValues.id },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at', '']},
        include: [
            // { model: UserModel },s
            { model: ChatParticipentsModel }
        ]
    });
    console.log("c", c)
    res.send(c)
});

export {
    getUsersController,
    createUserOneOnOneChatController
}