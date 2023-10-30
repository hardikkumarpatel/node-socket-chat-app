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