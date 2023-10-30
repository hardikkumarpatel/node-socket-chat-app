export interface UsersDTO {
    id: string,
    username: string,
    email: string,
    password: string,
    role: string,
    login_type: string,
    avatar_url: string,
    refresh_token: string

}

export interface ChatUserDTO {
    users: UsersDTO[]
}

