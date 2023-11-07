import { NextFunction, Response } from "express";
import asyncHander from "../helper/AsyncHandler.helper";
import { CustomRequest } from "../helper/CommonHandler";
import ApiErrorHandler from "../utils/ApiErrorHandler";
import { StatusCodes } from "http-status-codes";
import sequelize from "../database/DBConnection";
import { ChatAndParticipentsDTO, ChatParticipentDTO } from "../interface/Chat.interface";
import { SockerServer } from "../socket";
import { CHAT_EVENT_ENUM } from "../constant/SocketConstant";
import ApiResponseHandler from "../utils/ApiResponseHandler";
const { models: { chat: ChatModel, messages: ChatMessageModel, chat_participents: ChatParticipentsModel, users: UserModel } } = sequelize;

const sendMessageController = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { params: { ChatID }, body: { content }, user: { id } } = req;

    if ([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'Chat id is required! chat id is missing in params');
    }

    if (!content) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'content is required! content is missing in body');
    }

    const getExistingChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_enabled: true,
            is_deleted: false
        }
    });

    if (!getExistingChatDetails) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, 'Chat does not exists');
    }

    const message = await ChatMessageModel.create({
        sender_id: id,
        content: content || "",
        chat_id: ChatID
    });

    const getUserOneonOneChatDetail = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_enabled: true,
            is_deleted: false,
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

    const getMessageDetailByID = await ChatMessageModel.findOne({
        where: {
            id: message.dataValues.id,
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [{
            model: UserModel,
            attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        }]
    });

    const { chat_participents: chatParticipentsDetails } = getUserOneonOneChatDetail?.dataValues as ChatAndParticipentsDTO;
    if (chatParticipentsDetails.length) {
        chatParticipentsDetails.forEach((participantObjectId: ChatParticipentDTO) => {
            if (participantObjectId.user.id.toString() === id.toString()) return;
            // emit the receive message event to the other participants with received message as the payload
            SockerServer.emitSocketEvent(
                req,
                participantObjectId.toString(),
                CHAT_EVENT_ENUM.MESSAGE_RECEIVED_EVENT,
                getMessageDetailByID
            );
        });
    }

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Message saved successfully", getMessageDetailByID))
});

const getMessageController = asyncHander(async (req: CustomRequest, res: Response, next:NextFunction) => {
    const { params: { ChatID } } = req;
    if([':ChatID'].includes(ChatID)) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'Chat id is required! chat id is missing in params');
    }

    const getExistingChatDetails = await ChatModel.findOne({
        where: {
            id: ChatID,
            is_enabled: true,
            is_deleted: false
        }
    });

    if (!getExistingChatDetails) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, 'Chat does not exists');
    }

    const getAllMessageDetailByID = await ChatMessageModel.findAll({
        where: {
            chat_id: ChatID,
        },
        attributes: { exclude: ['is_enabled', 'is_deleted', 'created_at', 'deleted_at'] },
        include: [{
            model: UserModel,
            attributes: { exclude: ['password', 'refresh_token', 'login_type', 'is_enabled', 'is_deleted', 'created_at', 'updated_at', 'deleted_at'] }
        }],
        order: [['updated_at', 'DESC']]
    });

    return res.status(StatusCodes.OK).send(new ApiResponseHandler(StatusCodes.OK, "Message fetched successfully", getAllMessageDetailByID))


})
export {
    sendMessageController,
    getMessageController
}