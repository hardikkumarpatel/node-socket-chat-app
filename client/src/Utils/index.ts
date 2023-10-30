import { USER_STORAGE } from "../constant/Constant";
import { LocalStorage } from "./LocalStorage";

export const classNames = (...className: string[]) => {
    // Filter out any empty class names and join them with a space
    return className.filter(Boolean).join(" ");
};

export const getUserToken = (): string => {
    return LocalStorage.get(USER_STORAGE)['accessToken'];
}