/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/img-redundant-alt */
import {
    XMarkIcon,
} from "@heroicons/react/20/solid";
import moment from "moment";
import { useState } from "react";
import { classNames } from "../Utils";
import { ChatMessageDTO } from "../interface/Chat.interface";

const MessageItemComponent: React.FC<{
    isOwnMessage?: boolean;
    isGroupChatMessage?: boolean;
    message: ChatMessageDTO;
}> = ({ message, isOwnMessage, isGroupChatMessage }) => {
    const [resizedImage, setResizedImage] = useState<string | null>(null);
    return (
        <>
            {resizedImage ? (
                <div className="h-full z-40 p-8 overflow-hidden w-full absolute inset-0 bg-black/70 flex justify-center items-center">
                    <XMarkIcon
                        className="absolute top-5 right-5 w-9 h-9 text-white cursor-pointer"
                        onClick={() => setResizedImage(null)}
                    />
                    <img
                        className="w-full h-full object-contain"
                        src={resizedImage}
                        alt="chat image"
                    />
                </div>
            ) : null}
            <div
                className={classNames(
                    "flex justify-start items-end gap-3 max-w-lg min-w-",
                    isOwnMessage ? "ml-auto" : ""
                )}
            >
                <img
                    src={message.user.avatar_url}
                    className={classNames(
                        "h-8 w-8 object-cover rounded-full flex flex-shrink-0",
                        isOwnMessage ? "order-2" : "order-1"
                    )}
                />
                <div
                    className={classNames(
                        "p-4 rounded-3xl flex flex-col",
                        isOwnMessage
                            ? "order-1 rounded-br-none bg-gray-500"
                            : "order-2 rounded-bl-none bg-secondary"
                    )}
                >
                    {isGroupChatMessage && !isOwnMessage ? (
                        <p
                            className={classNames(
                                "text-xs font-semibold mb-2",
                                ["text-success", "text-danger"][
                                message.user.username.length % 2
                                ]
                            )}
                        >
                            {message.user.username}
                        </p>
                    ) : null}


                    {message.content ? (
                        <p className="text-sm text-white">{message.content}</p>
                    ) : null}
                    <p
                        className={classNames(
                            "mt-1.5 self-end text-[10px] inline-flex items-center text-zinc-300"
                        )}
                    >

                        {moment(message.updated_at).add("TIME_ZONE", "hours").fromNow(true)}{" "}
                        ago
                    </p>
                </div>
            </div>
        </>
    );
};

export default MessageItemComponent;
