import { API_BASE_URL } from "./Constant";

export const USER_LOGIN_URL = `${API_BASE_URL}/Users/Login`;
export const USER_REGISTER_URL = `${API_BASE_URL}/Users/Register`;
export const USERS_LIST_URL = `${API_BASE_URL}/Chat/Users`;
export const CREATE_USER_ONE_ON_ONE_CHAT_URL = `${API_BASE_URL}/Chat/CreateChat`;
export const CREATE_USER_GROUP_CHAT_URL = `${API_BASE_URL}/Chat/CreateGroupChat`;
export const GET_USER_CREATED_CHAT_URL = `${API_BASE_URL}/Chat`;
export const GET_GROUP_CHAT_DETAILS_BY_ID_URL = `${API_BASE_URL}/Chat/GetGroupChatDetails`;
export const DELETE_USER_ONE_ON_ONE_CHAT_URL = `${API_BASE_URL}/Chat/DeleteOneonOneChat`;
export const DELETE_USER_GROUP_CHAT_URL = `${API_BASE_URL}/Chat/DeleteGroupChat`;
export const RENAME_GROUP_CHAT_URL = `${API_BASE_URL}/Chat/RenameGroupChat`;
export const SEND_CHAT_MESSAGE_URL = `${API_BASE_URL}/Message/SendMessage`;
export const GET_CHAT_MESSAGE_URL = `${API_BASE_URL}/Message/GetMessage`;

