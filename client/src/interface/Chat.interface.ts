export interface UserDTO {
    id: string,
    username: string,
    email: string,
    role: string,
    avatar_url: string,
}

export interface UserChatParticipentsDTO {
    id: string;
    chat_id: string;
    user_id: string;
    user: UserDTO
}

export interface UserChatListDTO {
    id: string;
    is_group_chat: boolean;
    name: string;
    created_by: string;
    sender_id: string;
    receiver_id: string;
    updated_at: string;
    chat_participents: UserChatParticipentsDTO[]
}