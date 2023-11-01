export interface UserDTO {
    id: string;
    username: string,
    email: string,
    password: string,
    role: string,
    login_type: string,
    avatar_url: string;
    refresh_token: string,
    is_enabled: boolean,
    is_deleted: boolean,
    created_at: Date,
    updated_at: Date,
    deleted_at: Date
}
interface OneonOneChatParticipentsDTO {
    id: string;
    chat_id: string;
    user_id: string;
    user: OneonOneChatAdminDTO;
}
interface OneonOneChatAdminDTO {
    id: string;
    username: string;
    email: string;
    role: string;
    avatar_url: string
}
interface OneonOneChatDTO {
    id: string;
    name: string;
    admin: string;
    is_group_chat: boolean;
    user: OneonOneChatAdminDTO;
    chat_participents: OneonOneChatParticipentsDTO[]
}

export interface UserOneonOneChatDTO {
    chat: OneonOneChatDTO
}