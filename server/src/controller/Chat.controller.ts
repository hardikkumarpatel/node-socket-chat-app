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
import { ChatAndParticipentsDTO, ChatDTO, ChatParticipentDTO } from '../interface/Chat.interface';
const { models: { users: UserModel, chat: ChatModel, chat_participents: ChatParticipentsModel } } = sequelize;

const getUsersController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.user;
    const getUsers = await UserModel.findAll(
        {
            where: {
                id: { [Op.notIn]: [id] },
                is_enabled: true,
                is_deleted: false,
            },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        });
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Users fetched successfully", getUsers))
});

const createUserOneOnOneChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ReceiverID: receiverUserID }, user: { id: senderUserID } } = req;
    if (!receiverUserID) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, 'Receiver ID is required! Receiver id is missing in params');
    }

    const getReceiverUser = await UserModel.findOne({
        where: {
            id: receiverUserID,
            is_enabled: true,
            is_deleted: false
        }
    });
    if (!getReceiverUser) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, 'Receiver does not exists');
    }

    const { id } = getReceiverUser.dataValues as UserDTO;
    if (id.toString() === senderUserID.toString()) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "You can't send message to yourself");
    }

    const getUserOneonOneChatDetail = await ChatModel.findOne({
        where: {
            is_group_chat: false,
            is_enabled: true,
            is_deleted: false,
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
    const { id: CreatedChatID } = chat.dataValues as ChatDTO;
    if (CreatedChatID) {
        for (let user of [receiverUserID, senderUserID]) {
            await ChatParticipentsModel.create({
                chat_id: CreatedChatID,
                user_id: user
            })
        }
    }

    const getUserCreatedChatDetails = await ChatModel.findOne({
        where: {
            id: CreatedChatID,
            is_group_chat: false,
            is_enabled: true,
            is_deleted: false
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: CreatedChatID,
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

    const { chat_participents: chatParticipentsDetails } = getUserCreatedChatDetails?.dataValues as ChatAndParticipentsDTO;
    if (chatParticipentsDetails.length) {
        chatParticipentsDetails?.forEach((participant: ChatParticipentDTO) => {
            if (participant.user_id.toString() === senderUserID.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUserCreatedChatDetails
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users One on one chat create successfully", getUserCreatedChatDetails))
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
    const { id: CreatedChatID } = chat.dataValues as ChatDTO;
    if (CreatedChatID) {
        for (let user of members) {
            await ChatParticipentsModel.create({
                chat_id: CreatedChatID,
                user_id: user
            })
        }
    }

    const getUserCreatedGroupChatDetails = await ChatModel.findOne({
        where: {
            id: CreatedChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [
            {
                model: ChatParticipentsModel,
                as: 'chat_participents',
                required: true,
                where: {
                    chat_id: CreatedChatID,
                    user_id: [...members]
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
    const { chat_participents: chatParticipentsDetails } = getUserCreatedGroupChatDetails?.dataValues as ChatAndParticipentsDTO;
    if (chatParticipentsDetails.length) {
        chatParticipentsDetails?.forEach((participant: ChatParticipentDTO) => {
            if (participant.user_id.toString() === senderUserID.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUserCreatedGroupChatDetails
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users group chat create successfully", { chat }))
});

const getGroupChatDetailContainer = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID } } = req;
    if ([":ChatID"].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id required! chat id is missing in params");
    }
    const getGroupChatDetailsByID = await ChatModel.findOne(
        {
            where: {
                id: ChatID,
                is_group_chat: true,
                is_enabled: true,
                is_deleted: false
            },
            attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
            include: [
                {
                    model: ChatParticipentsModel,
                    as: 'chat_participents',
                    where: {
                        chat_id: ChatID,
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

    if (!getGroupChatDetailsByID) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exist");
    }

    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users group chat details fetch successfully", getGroupChatDetailsByID))
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
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
        }
    });

    if (!getGroupChat) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exist")
    }

    const { created_by: createdBy } = getGroupChat.dataValues as ChatDTO;
    if (createdBy.toString() !== id.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin")
    }

    await ChatModel.update({
        name,
    }, {
        where: {
            id: ChatID
        }
    })

    const getUpdateGroupChatDetailsByID = await ChatModel.findOne(
        {
            where: {
                id: ChatID,
                is_group_chat: true,
                is_enabled: true,
                is_deleted: false
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

    const { chat_participents: chatParticipentsDetails } = getUpdateGroupChatDetailsByID?.dataValues as ChatAndParticipentsDTO;
    if (chatParticipentsDetails.length) {
        chatParticipentsDetails?.forEach((participant: ChatParticipentDTO) => {
            if (participant.user_id.toString() === id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

            // emit event to other participants with new chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.NEW_CHAT_EVENT,
                getUpdateGroupChatDetailsByID
            );
        });
    }
    return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Group chat updated successfully", getUpdateGroupChatDetailsByID))

});

const deleteGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const getGroupChatByID = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
        }
    });
    if (!getGroupChatByID) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists")
    }
    if (getGroupChatByID.dataValues.created_by?.toString() !== id.toString()) {
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

    const getDeleteGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: false,
            is_deleted: true
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

    const { chat_participents: chatParticipentsDetails } = getDeleteGroupChatDetails?.dataValues as ChatAndParticipentsDTO;
    if (chatParticipentsDetails.length) {
        chatParticipentsDetails?.forEach((participant: ChatParticipentDTO) => {
            if (participant.user_id.toString() === id.toString()) return; // don't emit the event for the logged in use as he is the one who is deleting
            // emit event to other participants with left chat as a payload
            SockerServer.emitSocketEvent(
                req,
                participant.user_id?.toString(),
                CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT,
                getDeleteGroupChatDetails
            );
        });
    }

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Group chat deleted successfully", getDeleteGroupChatDetails))

});

const deleteOneonOneChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const getOneonOneChatDetailByID = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: false,
            is_enabled: true,
            is_deleted: false
        }
    });
    if (!getOneonOneChatDetailByID) {
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

    const getDeletedOneonOneChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: false,
            is_enabled: false,
            is_deleted: true
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

    const { chat_participents: chatParticipentsDetails } = getDeletedOneonOneChatDetails?.dataValues as ChatAndParticipentsDTO;

    const otherParticipant: ChatParticipentDTO = chatParticipentsDetails?.find(
        (participant: ChatParticipentDTO) => participant?.user_id.toString() !== id.toString() // get the other participant in chat for socket
    ) as ChatParticipentDTO;

    // emit event to other participant with left chat as a payload
    SockerServer.emitSocketEvent(
        req,
        otherParticipant?.user_id.toString(),
        CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT,
        getDeletedOneonOneChatDetails
    );
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "One on one chat deleted successfully", getDeletedOneonOneChatDetails))
});

const leaveGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, user: { id
    } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params")
    }

    const getGroupChatDetailsByID = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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
        ]
    });
    if (!getGroupChatDetailsByID) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists")
    }
    const { chat_participents: existingParticipants } = getGroupChatDetailsByID.dataValues as ChatAndParticipentsDTO;
    // check if the participant that is leaving the group, is part of the group
    const decodeParticipentUsers = existingParticipants.map((participent: ChatParticipentDTO) => participent.user_id);
    if (!decodeParticipentUsers?.includes(id)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "You are not a part of this group chat");
    }

    await ChatParticipentsModel.destroy({
        where: {
            chat_id: ChatID,
            user_id: id
        },
        force: true
    })
    const getUpdateGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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
    if (!getUpdateGroupChatDetails) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Left a group successfully", getUpdateGroupChatDetails))
});

const addNewParticipentsInGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID, ParticipentID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params ")
    }
    if ([':ParticipentID'].includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participents id is required! participents id missing in params ")
    }

    const getGroupChatDetailsByID = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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
    if (!getGroupChatDetailsByID) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists");
    }

    const { created_by: createdBy, chat_participents: chatParticipentsDetails } = getGroupChatDetailsByID.dataValues as ChatAndParticipentsDTO;
    // check if user who is adding is a group admin
    if (createdBy?.toString() !== id?.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin");
    }

    const decodeParticipentUsers = chatParticipentsDetails.map((participent: ChatParticipentDTO) => participent.user_id);
    if (decodeParticipentUsers?.includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.CONFLICT, "Participant already in a group chat");
    }

    await ChatParticipentsModel.create({
        chat_id: ChatID,
        user_id: ParticipentID
    })

    const getUpdateGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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
    if (!getUpdateGroupChatDetails) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    SockerServer.emitSocketEvent(req, ParticipentID, CHAT_EVENT_ENUM.NEW_CHAT_EVENT, getUpdateGroupChatDetails);
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Participant added successfully", getUpdateGroupChatDetails))
});

const removeParticipentsFromGroupChatController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID, ParticipentID }, user: { id } } = req;
    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Chat id is required! chat id missing in params ")
    }
    if ([':ParticipentID'].includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participents id is required! participents id missing in params ")
    }

    const getGroupChatDetailsByID = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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
    if (!getGroupChatDetailsByID) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "Group chat does not exists");
    }

    const { created_by: createdBy, chat_participents: chatParticipentsDetails } = getGroupChatDetailsByID.dataValues as ChatAndParticipentsDTO;
    if (createdBy?.toString() !== id?.toString()) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "You are not an admin");
    }

    // check if the participant that is being removed in a part of the group
    const decodeParticipentUsers = chatParticipentsDetails.map((participent: ChatParticipentDTO) => participent.user_id);
    if (!decodeParticipentUsers?.includes(ParticipentID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, "Participant does not exist in the group chat");
    }

    await ChatParticipentsModel.destroy({
        where: {
            chat_id: ChatID,
            user_id: ParticipentID
        },
        force: true
    });

    const getUpdateGroupChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_group_chat: true,
            is_enabled: true,
            is_deleted: false
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

    if (!getUpdateGroupChatDetails) {
        throw new ApiErrorHandler(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    SockerServer.emitSocketEvent(req, ParticipentID, CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT, getUpdateGroupChatDetails);
    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Participant removed successfully", getUpdateGroupChatDetails))

});

const getAllChatByUserController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.user as UserDTO;
    const getUserChatDetails = await ChatModel.findAll(
        {
            where: {
                created_by: id,
                is_enabled: true,
                is_deleted: false
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