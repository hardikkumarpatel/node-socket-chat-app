
export interface User {
    id: string,
    username: string,
    email: string,
    password: string,
    role: string,
    login_type: string,
    refresh_token: string,
}
export interface UserDTO {
    accessToken: string;
    refreshToken: string;
    user: User
}