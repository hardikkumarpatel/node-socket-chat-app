export interface ChatDTO {
    id: string;
    name: string;
    is_group_chat: boolean;
    created_by: string;
    sender_id: string;
    receiver_id: string;
    updated_at: string;
}

export interface ChatParticipentUserDTO {
    id: string;
    username: string;
    email: string;
    role: string;
    avatar_url: string;
}
export interface ChatParticipentDTO {
    id: string;
    chat_id: string;
    user_id: string;
    user: ChatParticipentUserDTO
}
export interface ChatAndParticipentsDTO {
    id: string;
    name: string;
    is_group_chat: boolean;
    created_by: string;
    sender_id: string;
    receiver_id: string;
    updated_at: string;
    chat_participents: ChatParticipentDTO[]
}

export interface ChatMessageDTO {
    id: string;
    sender_id: string;
    chat_id: string;
    content: string;
    updated_at: string;
    user: ChatParticipentUserDTO
}