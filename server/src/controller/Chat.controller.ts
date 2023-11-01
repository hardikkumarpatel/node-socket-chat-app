import { Response, NextFunction } from 'express';
import asyncHander from '../helper/AsyncHandler.helper';
import { CustomRequest } from '../helper/CommonHandler';
import sequelize from '../database/DBConnection';
import { Op, QueryTypes } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import ApiResponseHandler from '../utils/ApiResponseHandler';
import ApiErrorHandler from '../utils/ApiErrorHandler';
import { UserDTO, UserOneonOneChatDTO } from '../interface/User.interface';
import { populateUserOneonOneChatParticipents } from '../helper/UserCommon.helper';
const { models: { users: UserModel, chat: ChatModel, chat_participents: ChatParticipentsModel } } = sequelize;

const getUsersController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.user;
    const getUsers = await UserModel.findAll(
        {
            where: { id: { [Op.notIn]: [id] } },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        });
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Users fetched successfully", getUsers))
});

const createUserOneOnOneChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ReceiverID: receiverUserID }, user: { id: senderUserID } } = req;
    if (!receiverUserID) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, 'Receiver ID is required');
    }

    const getReceiverUser = await UserModel.findOne({ where: { id: receiverUserID } });
    if (!getReceiverUser) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, 'Receiver does not exists');
    }

    const { id } = getReceiverUser.dataValues as UserDTO;
    if (id === senderUserID) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "You can't send message to yourself");
    }

    const getUserOneonOneChat = await ChatModel.findOne({
        where: {
            is_group_chat: false,
            created_by: senderUserID,
            sender_id: senderUserID,
            receiver_id: receiverUserID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    user_id: [receiverUserID, senderUserID]
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

    // const result: any = await sequelize.query(
    //     `SELECT DISTINCT ch.user_id, c.admin, c.id 
    //      FROM public.chats AS c 
    //      INNER JOIN public.chat_participents AS ch ON ch.chat_id = c.id
    //      WHERE c."admin" = :admin 
    //      AND ch.user_id IN(:status)
    //      LIMIT 1`,
    //     {
    //         replacements: {
    //             admin: senderUserID,
    //             status: [senderUserID, receiverUserID]
    //         },
    //         type: QueryTypes.SELECT,
    //     }
    // ).then(result => result[0]);

    if (getUserOneonOneChat) {
        // const getUserOneonOneChats = await ChatModel.findOne({
        //     where: {
        //         id: result.id,
        //     },
        //     attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] },
        //     include: [
        //         {
        //             model: ChatParticipentsModel,
        //             as: 'chat_participents',
        //             required: true,
        //             where: {
        //                 chat_id: result.id,
        //                 user_id: [receiverUserID, senderUserID]
        //             },
        //             attributes: {
        //                 exclude: ['created_at', 'updated_at', 'deleted_at'],
        //             },
        //             include: [{
        //                 model: UserModel,
        //                 attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        //             }]
        //         },
        //     ],
        // });
        return res
            .status(StatusCodes.OK)
            .json(new ApiResponseHandler(200, "One on one chat already exists!", { chat: getUserOneonOneChat }));
    }

    const chat = await ChatModel.create({
        name: 'One on one chat',
        is_group_chat: false,
        created_by: senderUserID,
        sender_id: senderUserID,
        receiver_id: receiverUserID
    });
    const { dataValues } = chat;
    if (id) {
        for (let user of [receiverUserID, senderUserID]) {
            await ChatParticipentsModel.create({
                chat_id: dataValues.id,
                user_id: user
            })
        }
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users One on one chat create successfully", { chat }))
});

const createUserGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { body: { name, participents = [] }, user: { id: senderUserID } } = req;
    if (participents.includes(senderUserID)) {
        throw new ApiErrorHandler(
            StatusCodes.BAD_REQUEST,
            "Participants array should not contain the group creator"
        );
    }

    const members = [...new Set([...participents, senderUserID])];
    if (members.length < 3) {
        throw new ApiErrorHandler(
            StatusCodes.BAD_REQUEST,
            "Seems like you have passed duplicate participants."
        );
    }

    const chat = await ChatModel.create({
        name,
        is_group_chat: true,
        created_by: senderUserID,
        sender_id: senderUserID,
    });
    const { dataValues } = chat;
    if (senderUserID) {
        for (let user of members) {
            await ChatParticipentsModel.create({
                chat_id: dataValues.id,
                user_id: user
            })
        }
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users group chat create successfully", { chat }))
});

const getAllChatByUserController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.user as UserDTO;
    const getUserChatDetails = await ChatModel.findAll(
        {
            where: {
                created_by: id,
            },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
            include: [
                {
                    model: ChatParticipentsModel,
                    as: 'chat_participents',
                    attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
                    include: [{
                        model: UserModel,
                        attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
                    }]
                },
            ],
            order: [['updated_at', 'DESC']]
        });

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Users chat fetched successfully", getUserChatDetails))

});

export {
    getUsersController,
    createUserOneOnOneChatController,
    createUserGroupChatController,
    getAllChatByUserController
}