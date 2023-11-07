import { USER_STORAGE } from "../constant/Constant";
import { ChatAndParticipentsDTO } from "../interface/Chat.interface";
import { UserDAO } from "../interface/User.interface";
import { LocalStorage } from "./LocalStorage";

export const classNames = (...className: string[]) => {
    return className.filter(Boolean).join(" ");
};

export const getUserToken = (): string => {
    return LocalStorage.get(USER_STORAGE)['accessToken'];
}

export const getChatObjectMetadata = (
    chat: ChatAndParticipentsDTO, // The chat item for which metadata is being generated.
    loggedInUser: UserDAO // The currently logged-in user details.
) => {
    if (chat.is_group_chat) {
        return {
            avatar: "https://via.placeholder.com/100x100.png",
            title: chat.name,
            description: `${chat.chat_participents.length} members in the chat`,
            last_message: 'No message yet'
        };
    } else {
        const participant = chat.chat_participents.find(
            (p) => p.user.id !== loggedInUser.id
        );
        return {
            avatar: participant?.user.avatar_url,
            title: participant?.user.username,
            description: participant?.user.email,
            last_message: 'No message yet'
        };
    }
};