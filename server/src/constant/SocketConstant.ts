

export const CHAT_EVENT_ENUM = Object.freeze({
    ADMIN_CREATE_ROOM: 'ADMIN_CREATE_ROOM',
    USER_CONNECTED: 'USER_CONNECTED',
    // ? once user is ready to go
    CONNECTED_EVENT: "connection",
    // ? when user gets disconnected
    DISCONNECT_EVENT: "disconnect",
    // ? when user joins a socket room
    JOIN_CHAT_EVENT: "JOIN_CHAT_EVENT",
    // ? when participant gets removed from group, chat gets deleted or leaves a group
    LEAVE_CHAT_EVENT: "LEAVE_CHAT_EVENT",
    // ? when admin updates a group name
    UPDATE_GROUP_NAME_EVENT: "UPDATE_GROUP_NAME_EVENT",
    // ? when new message is received
    MESSAGE_RECEIVED_EVENT: "MESSAGE_RECEIVED_EVENT",
    // ? when there is new one on one chat, new group chat or user gets added in the group
    NEW_CHAT_EVENT: "NEW_CHAT_EVENT",
    // ? when there is an error in socket
    SOCKET_ERROR_EVENT: "SOCKET_ERROR_EVENT",
    // ? when participant stops typing
    STOP_TYPING_EVENT: "STOP_TYPING_EVENT",
    // ? when participant starts typing
    TYPING_EVENT: "TYPING_EVENT",
})