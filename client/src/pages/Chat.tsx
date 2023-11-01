import React, { useCallback, useEffect, useRef, useState } from "react";
import AddChatCompoent from "../component/AddChatComponent";
import { GET_USER_CREATED_CHAT_URL } from "../constant/Endpoint.constant";
import { LocalStorage } from "../Utils/LocalStorage";
import { USER_ACTIVE_CHAT_SESSION, USER_STORAGE } from "../constant/Constant";
import ChatItemComponent from "../component/ChatItemComponent";
import { useToastContext } from "../context/ToastContext";
import { ClientApiResponseDTO } from "../interface/Common.interface";
import { UserChatListDTO } from "../interface/Chat.interface";
import { useAuthContext } from "../context/AuthContext";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { classNames, getChatObjectMetadata } from "../Utils";
import { UserDAO } from "../interface/User.interface";
import TypingComponent from "../component/TypingComponent";

const ChatPage: React.FC<{}> = () => {
    const { toast } = useToastContext();
    const { context } = useAuthContext();
    const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);
    const [userChatsList, setUserChatsList] = useState<UserChatListDTO[]>([] as UserChatListDTO[]);
    const [message, setMessage] = useState<string>("");
    const [currentUserChat, setCurrentUserChat] = useState<UserChatListDTO>({} as UserChatListDTO);
    const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);


    const getUserChatList = useCallback(async () => {
        try {
            const res = await fetch(GET_USER_CREATED_CHAT_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`,
                }
            });
            const { success, message, data } = await res.json() as ClientApiResponseDTO<UserChatListDTO[]>;
            if (!success) {
                return toast('error', message)
            }

            setUserChatsList(data)
        } catch (ErrorException: any) {
            toast('error', ErrorException.message)
        }
    }, [toast]);

    useEffect(() => {
        getUserChatList();
        const currentUserChatSession = LocalStorage.get(USER_ACTIVE_CHAT_SESSION);
        if (currentUserChatSession) {
            setCurrentUserChat(currentUserChatSession)
            // currentUserChat.current = currentUserChatSession;
            // If the socket connection exists, emit an event to join the specific chat using its ID.
            // socket?.emit(JOIN_CHAT_EVENT, _currentChat.current?._id);
            // Fetch the messages for the current chat.
            // getMessages();
        }
    }, [getUserChatList])

    return (
        <>
            {openAddChatDialog && (
                <AddChatCompoent
                    open={openAddChatDialog}
                    onClose={() => setOpenAddChatDialog(false)}
                    onSuccess={() => getUserChatList()}
                />
            )}
            <div className="w-full justify-between items-stretch h-screen flex flex-shrink-0">
                <div className="w-3/12 relative bg-white shadow overflow-y-auto px-4">
                    <div className="z-10 w-full sticky top-0 bg-dark py-4 flex justify-between items-center gap-4">
                        <input type="text" name="username" id="username"
                            className="w-8/12  bg-gray-50 border outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required
                            value={localSearchQuery}
                            onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
                                setLocalSearchQuery(value.toLowerCase())
                            } />
                        <button
                            type="submit"
                            className="w-4/12 text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                            onClick={() => setOpenAddChatDialog(true)}
                        >Add Chat</button>
                    </div>
                    {
                        [...(userChatsList || [])]
                            .filter((UserChatObj) => localSearchQuery
                                ? getChatObjectMetadata(UserChatObj, context?.user as UserDAO)
                                    .title?.toLocaleLowerCase()
                                    ?.includes(localSearchQuery)
                                :
                                true)
                            .map((UserChatObj) => (
                                <ChatItemComponent
                                    isActive={UserChatObj.id === currentUserChat?.id}
                                    unreadCount={0}
                                    onClick={(Chat: UserChatListDTO) => {
                                        console.log("WE are in on click", Chat)
                                        console.log("currentUserChat.current?.id ", currentUserChat?.id)
                                        if (
                                            currentUserChat?.id &&
                                            currentUserChat?.id === Chat.id
                                        ) {
                                            return;
                                        }
                                        LocalStorage.set(USER_ACTIVE_CHAT_SESSION, Chat);
                                        setCurrentUserChat(Chat)
                                        // currentUserChat = Chat;
                                        // setMessage("");
                                        // getMessages();
                                    }}
                                    onChatDelete={(ChatID: string) => {
                                        setUserChatsList((prev) =>
                                            prev.filter((chat) => chat.id !== ChatID)
                                        );
                                        if (currentUserChat?.id === ChatID) {
                                            setCurrentUserChat({} as UserChatListDTO)
                                            // currentUserChat.current = null;
                                            LocalStorage.remove(USER_ACTIVE_CHAT_SESSION);
                                        }
                                    }}
                                    chat={UserChatObj}
                                />
                            ))
                    }
                </div>
                <div className="w-9/12 border-l-[0.1px] border-secondary">
                    {currentUserChat && currentUserChat?.id ? (
                        <>
                            <div className="p-4 sticky top-0 bg-dark flex justify-between items-center w-full border-b-[0.1px] border-secondary">
                                <div className="flex justify-start items-center w-max gap-3">
                                    {currentUserChat.is_group_chat ? (
                                        <div className="w-12 relative h-12 flex-shrink-0 flex justify-start items-center flex-nowrap">
                                            {currentUserChat.chat_participents
                                                .slice(0, 3)
                                                .map((participant, i) => {
                                                    return (
                                                        <img
                                                            alt=""
                                                            key={participant.id}
                                                            src={participant.user.avatar_url}
                                                            className={classNames(
                                                                "w-9 h-9  rounded-full absolute",
                                                                i === 0
                                                                    ? "left-0 z-30"
                                                                    : i === 1
                                                                        ? "left-2 z-20"
                                                                        : i === 2
                                                                            ? "left-4 z-10"
                                                                            : ""
                                                            )}
                                                        />
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <img
                                            alt=""
                                            className="h-9 w-9 rounded-full flex flex-shrink-0 object-cover"
                                            src={
                                                getChatObjectMetadata(currentUserChat, context?.user as UserDAO).avatar
                                            }
                                        />
                                    )}
                                    <div>
                                        <p className="font-bold">
                                            {getChatObjectMetadata(currentUserChat, context?.user as UserDAO).title}
                                        </p>
                                        <small className="text-zinc-400">
                                            {
                                                getChatObjectMetadata(currentUserChat, context?.user as UserDAO)
                                                    .description
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div
                                className={classNames(
                                    "p-8 overflow-y-auto flex flex-col-reverse gap-6 w-full h-[calc(100vh-176px)]"
                                )}
                                id="message-window"
                            >
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-[calc(100%-88px)]">
                                        <TypingComponent />
                                    </div>
                                ) : (
                                    <>
                                        {isTyping ? <TypingComponent /> : null}
                                        {/* {messages?.map((msg) => {
                      return (
                        <MessageItem
                          key={msg._id}
                          isOwnMessage={msg.sender?._id === user?._id}
                          isGroupChatMessage={currentChat.current?.isGroupChat}
                          message={msg}
                        />
                      );
                    })} */}
                                    </>
                                )}
                            </div>
                            <div className="sticky top-full p-4 flex justify-between items-center w-full gap-2 border-t-[0.1px] border-secondary">
                                <input
                                    className="w-full font-light bg-gray-50 border outline-none border-gray-300 text-gray-900  rounded-lg focus:ring-primary-600 focus:border-primary-600 block py-4 px-5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Message"
                                    value={message}
                                //   onChange={handleOnMessageChange}
                                //   onKeyDown={(e) => {
                                //     if (e.key === "Enter") {
                                //       sendChatMessage();
                                //     }
                                //   }}
                                />
                                <button
                                    //   onClick={sendChatMessage}
                                    disabled={!message}
                                    className="p-4 rounded-full bg-dark hover:bg-gray-300 disabled:opacity-50"
                                >
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex text-2xl text-gray-500 justify-center items-center">
                            NO CHAT SELECTED
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ChatPage;