import { Response, NextFunction } from 'express';
import asyncHander from '../helper/AsyncHandler.helper';
import { CustomRequest } from '../helper/CommonHandler';
import sequelize from '../database/DBConnection';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import ApiResponseHandler from '../utils/ApiResponseHandler';
import ApiErrorHandler from '../utils/ApiErrorHandler';
import { UserDTO } from '../interface/User.interface';
import { SockerServer } from '../socket/index';
import { CHAT_EVENT_ENUM } from '../constant/SocketConstant';
import { getUserOneonOneChatDetails } from '../services/Chat.service';
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

    const chatWhereConditions = {
        is_group_chat: false,
        created_by: senderUserID,
        sender_id: senderUserID,
        receiver_id: receiverUserID
    }
    const chatParticipentsWhereConditions = {
        user_id: [receiverUserID, senderUserID]
    }
    const getUserOneonOneChatDetail = await getUserOneonOneChatDetails(chatWhereConditions, chatParticipentsWhereConditions);
    if (getUserOneonOneChatDetail) {
        return res
            .status(StatusCodes.OK)
            .json(new ApiResponseHandler(200, "One on one chat already exists!", getUserOneonOneChatDetail));
    }

    const chat = await ChatModel.create({
        name: 'One on one chat',
        is_group_chat: false,
        created_by: senderUserID,
        sender_id: senderUserID,
        receiver_id: receiverUserID
    });
    const { dataValues } = chat;
    if (dataValues.id) {
        for (let user of [receiverUserID, senderUserID]) {
            await ChatParticipentsModel.create({
                chat_id: dataValues.id,
                user_id: user
            })
        }
    }

    const chatWhereConditions_1 = {
        is_group_chat: false,
        id: dataValues.id
    }
    const chatParticipentsWhereConditions_2 = {
        chat_id: dataValues.id,
        user_id: [receiverUserID, senderUserID]
    }
    const getUserCreatedChat = await getUserOneonOneChatDetails(chatWhereConditions_1, chatParticipentsWhereConditions_2);
    const chat_participents = getUserCreatedChat?.dataValues.chat_participents;
    if (chat_participents.length) {
        chat_participents?.forEach((participant) => {
            if (participant.user_id.toString() === req.user.id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUserCreatedChat
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users One on one chat create successfully", getUserCreatedChat))
});

const createUserGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { body: { name, participents = [] }, user: { id: senderUserID } } = req;
    if (!name) {
        throw new ApiErrorHandler(
            StatusCodes.BAD_REQUEST,
            "Group name is required! group name is missing in body"
        );

    }
    if (participents.length < 2) {
        throw new ApiErrorHandler(
            StatusCodes.BAD_REQUEST,
            "Participants must required at least two memmber! participants is missing in body"
        );
    }

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
    if (dataValues.id) {
        for (let user of members) {
            await ChatParticipentsModel.create({
                chat_id: dataValues.id,
                user_id: user
            })
        }
    }

    const chatWhereConditions_1 = {
        is_group_chat: true,
        id: dataValues.id
    }
    const chatParticipentsWhereConditions_2 = {
        chat_id: dataValues.id,
        user_id: [...members]
    }

    const getUserCreatedChat = await getUserOneonOneChatDetails(chatWhereConditions_1, chatParticipentsWhereConditions_2)
    const chat_participents = getUserCreatedChat?.dataValues.chat_participents;
    if (chat_participents.length) {
        chat_participents?.forEach((participant) => {
            if (participant.user_id.toString() === req.user.id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUserCreatedChat
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users group chat create successfully", { chat }))
});

const getGroupChatDetailContainer = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID } } = req;
    if (!ChatID) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is missing! in request params");
    }
    const getGroupChatDetail = await ChatModel.findOne(
        {
            where: {
                id: ChatID,
                is_group_chat: true
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

    if (!getGroupChatDetail) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exist");
    }

    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users group chat details fetch successfully", getGroupChatDetail))
});

const renameGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, body: { name }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")

    }
    if (!name) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "name is required! name missing in body")
    }

    const getGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true
        }
    });

    if (!getGroupChat) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exist")
    }

    if (getGroupChat.dataValues.created_by.toString() !== id.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin")
    }

    await ChatModel.update({
        name,
    }, {
        where: {
            id: ChatID
        }
    })

    const getUpdateGroupChatDetails = await ChatModel.findOne(
        {
            where: {
                id: ChatID,
            },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
            include: [
                {
                    model: ChatParticipentsModel,
                    as: 'chat_participents',
                    where: {
                        chat_id: ChatID
                    },
                    attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
                    include: [{
                        model: UserModel,
                        attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
                    }]
                },
            ],
            order: [['updated_at', 'DESC']]
        });

    const chat_participents = getUpdateGroupChatDetails?.dataValues.chat_participents;
    if (chat_participents.length) {
        chat_participents?.forEach((participant) => {
            if (participant.user_id.toString() === req.user.id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUpdateGroupChatDetails
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Group chat updated successfully", getUpdateGroupChatDetails))

});

const deleteGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const deleteGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: ChatID
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
    if (!deleteGroupChat) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists")
    }
    if (deleteGroupChat.dataValues.created_by?.toString() !== id.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Only admin can delete the group")
    }
    await ChatModel.update({
        is_enabled: false,
        is_deleted: true,
        deleted_at: new Date(),
    }, {
        where: {
            id: ChatID
        }
    })
    deleteGroupChat.dataValues.chat_participents?.forEach((participant) => {
        if (participant.user_id.toString() === IdleDeadline.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
        // emit event to other participants with left chat as a payload
        SockerServer.emitSocketEvent(
            req,
            participant._id?.toString(),
            CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT,
            deleteGroupChat
        );
    });
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Group chat deleted successfully", deleteGroupChat))

});

const deleteOneonOneChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const deleteOneonOneChat = await ChatModel.findOne({
        where: {
            id: ChatID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: ChatID
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

    if (!deleteOneonOneChat) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "One on one chat does not exists")
    }

    await ChatModel.update({
        is_enabled: false,
        is_deleted: true,
        deleted_at: new Date(),
    }, {
        where: {
            id: ChatID
        }
    });

    const otherParticipant = deleteOneonOneChat.dataValues?.chat_participents?.find(
        (participant) => participant?.user_id.toString() !== id.toString() // get the other participant in chat for socket
    );

    // emit event to other participant with left chat as a payload
    SockerServer.emitSocketEvent(
        req,
        otherParticipant._id?.toString(),
        CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT,
        deleteOneonOneChat
    );
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "One on one chat deleted successfully", deleteOneonOneChat))
});

const leaveGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id
    } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const getGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID
        }
    });
    if (!getGroupChat) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists")
    }
    const existingParticipants = getGroupChat.dataValues.chat_participents;

    // check if the participant that is leaving the group, is part of the group
    if (!existingParticipants?.includes(id)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "You are not a part of this group chat");
    }
    await ChatParticipentsModel.destroy({
        where: {
            chat_id: ChatID,
            user_id: id
        },
        force: true
    })
    const getUpdateGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: ChatID
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
    if (!getUpdateGroupChat) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Left a group successfully", getUpdateGroupChat))
});

const addNewParticipentsInGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID, ParticipentID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params ")
    }
    if ([':ParticipentID'].includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participents id is required! participents id missing in params ")
    }

    const getGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID
        }
    });
    if (!getGroupChatDetails) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists");
    }

    // check if user who is adding is a group admin
    if (getGroupChatDetails.dataValues.created_by?.toString() !== id?.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin");
    }

    const existingParticipants = getGroupChatDetails.dataValues.chat_participents;;
    if (existingParticipants?.includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.CONFLICT, "Participant already in a group chat");
    }

    await ChatParticipentsModel.create({
        chat_id: ChatID,
        user_id: ParticipentID
    })

    const getUpdateGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: ChatID
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
    if (!getUpdateGroupChat) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    SockerServer.emitSocketEvent(req, ParticipentID, CHAT_EVENT_ENUM.NEW_CHAT_EVENT, getUpdateGroupChat);
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Participant added successfully", getUpdateGroupChat))
});

const removeParticipentsFromGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID, ParticipentID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params ")
    }
    if ([':ParticipentID'].includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participents id is required! participents id missing in params ")
    }

    const getGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID
        }
    });
    if (!getGroupChatDetails) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists");
    }

    if (getGroupChatDetails.dataValues.created_by?.toString() !== id?.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin");
    }

    const existingParticipants = getGroupChatDetails.dataValues.chat_participents;

    // check if the participant that is being removed in a part of the group
    if (!existingParticipants?.includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participant does not exist in the group chat");
    }

    await ChatParticipentsModel.destroy({
        where: {
            chat_id: ChatID,
            user_id: ParticipentID
        },
        force: true
    });

    const getUpdateGroupChat = await ChatModel.findOne({
        where: {
            id: ChatID
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: ChatID
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

    if (!getUpdateGroupChat) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    SockerServer.emitSocketEvent(req, ParticipentID, CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT, getUpdateGroupChat);
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Participant removed successfully", getUpdateGroupChat))

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
    getGroupChatDetailContainer,
    renameGroupChatController,
    deleteGroupChatController,
    deleteOneonOneChatController,
    leaveGroupChatController,
    addNewParticipentsInGroupChatController,
    removeParticipentsFromGroupChatController,
    getAllChatByUserController
}