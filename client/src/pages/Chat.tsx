import React, { useCallback, useEffect, useRef, useState } from "react";
import AddChatCompoent from "../component/AddChatComponent";
import { GET_CHAT_MESSAGE_URL, GET_USER_CREATED_CHAT_URL, SEND_CHAT_MESSAGE_URL } from "../constant/Endpoint.constant";
import { LocalStorage } from "../Utils/LocalStorage";
import { USER_ACTIVE_CHAT_SESSION, USER_STORAGE } from "../constant/Constant";
import ChatItemComponent from "../component/ChatItemComponent";
import { useToastContext } from "../context/ToastContext";
import { ClientApiResponseDTO } from "../interface/Common.interface";
import { ChatAndParticipentsDTO, ChatMessageDTO } from "../interface/Chat.interface";
import { useAuthContext } from "../context/AuthContext";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { classNames, getChatObjectMetadata } from "../Utils";
import { UserDAO } from "../interface/User.interface";
import TypingComponent from "../component/TypingComponent";
import { useSocketContext } from "../context/SocketContent";
import { CHAT_EVENT_ENUM } from "../constant/Socket.constant";
import MessageItemComponent from "../component/MessageItemComponent";
import { Socket } from "socket.io-client";

const ChatPage: React.FC<{}> = () => {
    const { toast } = useToastContext();
    const { context } = useAuthContext();
    const { socket } = useSocketContext();
    const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);
    const [userChatsList, setUserChatsList] = useState<ChatAndParticipentsDTO[]>([] as ChatAndParticipentsDTO[]);
    const [messages, setMessage] = useState<string>("");
    const [currentUserChat, setCurrentUserChat] = useState<ChatAndParticipentsDTO>({} as ChatAndParticipentsDTO);
    const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [selfTyping, setSelfTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessageDTO[]>([]);
    const [unreadMessages, setUnreadMessages] = useState<ChatMessageDTO[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleOnMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Update the message state with the current input value
        setMessage(event.target.value);
        // If socket doesn't exist or isn't connected, exit the function
        if (!socket || !isConnected) return;

        // Check if the user isn't already set as typing
        if (!selfTyping) {
            // Set the user as typing
            setSelfTyping(true);
            // Emit a typing event to the server for the current chat
            socket.emit(CHAT_EVENT_ENUM.TYPING_EVENT, currentUserChat.id);
        }

        // Clear the previous timeout (if exists) to avoid multiple setTimeouts from running
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Define a length of time (in milliseconds) for the typing timeout
        const timerLength = 3000;
        // Set a timeout to stop the typing indication after the timerLength has passed
        typingTimeoutRef.current = setTimeout(() => {
            // Emit a stop typing event to the server for the current chat
            socket.emit(CHAT_EVENT_ENUM.STOP_TYPING_EVENT, currentUserChat.id);
            // Reset the user's typing state
            setSelfTyping(false);
        }, timerLength);
    };

    const getMessages = useCallback(async () => {
        if (!currentUserChat.id) {
            return toast('error', "No chat is selected")
        };

        if (!socket) {
            return toast('error', "Socket is not available")
        }

        // Emit an event to join the current chat
        socket.emit(CHAT_EVENT_ENUM.JOIN_CHAT_EVENT, currentUserChat.id);
        // Filter out unread messages from the current chat as those will be read
        setUnreadMessages(
            unreadMessages.filter((msg) => msg.id !== currentUserChat.id)
        );

        try {
            setLoadingMessages(true);
            const users = await fetch(`${GET_CHAT_MESSAGE_URL}/${currentUserChat.id}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
                },
            });
            const { success, message, data } = await users.json() as ClientApiResponseDTO<ChatMessageDTO[]>;
            if (!success) {
                return toast('error', message)
            }

            toast('success', message);
            setLoadingMessages(false);
            setChatMessages(data);
        } catch (Exception: any) {
            toast('error', Exception.message);
        }
    }, [currentUserChat, socket, toast, unreadMessages]);

    const sendChatMessage = async () => {
        // If no current chat ID exists or there's no socket connection, exit the function
        if (!currentUserChat.id || !socket) return;

        // Emit a STOP_TYPING_EVENT to inform other users/participants that typing has stopped
        socket.emit(CHAT_EVENT_ENUM.STOP_TYPING_EVENT, currentUserChat.id);
        try {
            const users = await fetch(`${SEND_CHAT_MESSAGE_URL}/${currentUserChat.id}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
                },
                body: JSON.stringify({
                    content: messages
                })
            });
            const { success, message, data } = await users.json() as ClientApiResponseDTO<ChatMessageDTO>;
            if (!success) {
                return toast('error', message)
            }

            toast('success', message);
            setMessage("");
            setChatMessages((prev) => [data, ...prev]);
            // updateChatLastMessage(currentChat.current?._id || "", res.data); // Update the last message in the chat
        } catch (Exception: any) {
            toast('error', Exception.message);
        }
    };

    const handleOnSocketTyping = useCallback(async (chatId: string) => {
        if (chatId !== currentUserChat.id) return;
        setIsTyping(true);
    }, [currentUserChat]);

    const handleOnSocketStopTyping = useCallback(async (chatId: string) => {
        if (chatId !== currentUserChat.id) return;
        setIsTyping(false);
    }, [currentUserChat]);

    const onMessageReceived = useCallback(async (message: ChatMessageDTO) => {
        if (message.chat_id !== currentUserChat.id) {
            setUnreadMessages((prev) => [message, ...prev]);
        } else {
            // If it belongs to the current chat, update the messages list for the active chat
            setChatMessages((prev) => [message, ...prev]);
        }

        // Update the last message for the chat to which the received message belongs
        // updateChatLastMessage(message.chat || "", message);
    }, [currentUserChat]);

    const onNewChat = useCallback(async (chat: ChatAndParticipentsDTO) => {
        setUserChatsList((prev) => [chat, ...prev]);
    }, []);

    const onChatLeave = useCallback(async (chat: ChatAndParticipentsDTO) => {
        // Check if the chat the user is leaving is the current active chat.
        if (chat.id === currentUserChat.id) {
            // If the user is in the group chat they're leaving, close the chat window.
            //   currentChat.current = null;
            // Remove the currentChat from local storage.
            setCurrentUserChat({} as ChatAndParticipentsDTO)
            LocalStorage.remove(USER_ACTIVE_CHAT_SESSION);
        }
        // Update the chats by removing the chat that the user left.
        setUserChatsList((prev) => prev.filter((c) => c.id !== chat.id));
    }, [currentUserChat]);

    const onGroupNameChange = useCallback(async (chat: ChatAndParticipentsDTO) => {
        // Check if the chat being changed is the currently active chat
        if (chat.id === currentUserChat.id) {
            // Update the current chat with the new details
            setCurrentUserChat(chat)
            // Save the updated chat details to local storage
            LocalStorage.set(USER_ACTIVE_CHAT_SESSION, chat);
        }

        // Update the list of chats with the new chat details
        setUserChatsList((prev) => [
            // Map through the previous chats
            ...prev.map((c) => {
                // If the current chat in the map matches the chat being changed, return the updated chat
                if (c.id === chat.id) {
                    return chat;
                }
                // Otherwise, return the chat as-is without any changes
                return c;
            }),
        ]);
    }, [currentUserChat]);

    const getUserChatList = useCallback(async () => {
        try {
            const res = await fetch(GET_USER_CREATED_CHAT_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`,
                }
            });
            const { success, message, data } = await res.json() as ClientApiResponseDTO<ChatAndParticipentsDTO[]>;
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
            // If the socket connection exists, emit an event to join the specific chat using its ID.
            socket?.emit(CHAT_EVENT_ENUM.JOIN_CHAT_EVENT, currentUserChat.id);
            // Fetch the messages for the current chat.
            getMessages();
        }
    }, [])

    const onConnectSocket = useCallback(() => setIsConnected(true), [])
    const onDisconnectSocket = useCallback(() => setIsConnected(false), [])

    useEffect(() => {
        if (!socket) return;

        socket.on(CHAT_EVENT_ENUM.CONNECTED_EVENT, onConnectSocket);
        socket.on(CHAT_EVENT_ENUM.DISCONNECT_EVENT, onDisconnectSocket);
        socket.on(CHAT_EVENT_ENUM.TYPING_EVENT, handleOnSocketTyping);
        socket.on(CHAT_EVENT_ENUM.STOP_TYPING_EVENT, handleOnSocketStopTyping);
        socket.on(CHAT_EVENT_ENUM.MESSAGE_RECEIVED_EVENT, onMessageReceived);
        socket.on(CHAT_EVENT_ENUM.NEW_CHAT_EVENT, onNewChat);
        socket.on(CHAT_EVENT_ENUM.LEAVE_CHAT_EVENT, onChatLeave);
        socket.on(CHAT_EVENT_ENUM.UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
        return () => {
            socket.off(CHAT_EVENT_ENUM.CONNECTED_EVENT, onConnectSocket);
            socket.off(CHAT_EVENT_ENUM.DISCONNECT_EVENT, onDisconnectSocket);
        }

    }, [socket, onConnectSocket, onDisconnectSocket, handleOnSocketTyping, handleOnSocketStopTyping, onMessageReceived, onNewChat, onChatLeave, onGroupNameChange]);

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
                                    onClick={(Chat: ChatAndParticipentsDTO) => {
                                        if (
                                            currentUserChat?.id &&
                                            currentUserChat?.id === Chat.id
                                        ) {
                                            return;
                                        }
                                        LocalStorage.set(USER_ACTIVE_CHAT_SESSION, Chat);
                                        setCurrentUserChat(Chat)
                                        setMessage("");
                                        getMessages();
                                    }}
                                    onChatDelete={(ChatID: string) => {
                                        setUserChatsList((prev) =>
                                            prev.filter((chat) => chat.id !== ChatID)
                                        );
                                        if (currentUserChat?.id === ChatID) {
                                            setCurrentUserChat({} as ChatAndParticipentsDTO)
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
                                        {chatMessages?.map((msg: ChatMessageDTO) => {
                                            return (
                                                <MessageItemComponent
                                                    key={msg.id}
                                                    isOwnMessage={msg.user.id === context?.user.id}
                                                    isGroupChatMessage={currentUserChat.is_group_chat}
                                                    message={msg}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                            <div className="sticky top-full p-4 flex justify-between items-center w-full gap-2 border-t-[0.1px] border-secondary">
                                <input
                                    className="w-full font-light bg-gray-50 border outline-none border-gray-300 text-gray-900  rounded-lg focus:ring-primary-600 focus:border-primary-600 block py-4 px-5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Message"
                                    value={messages}
                                    onChange={handleOnMessageChange}
                                //   onKeyDown={(e) => {
                                //     if (e.key === "Enter") {
                                //       sendChatMessage();
                                //     }
                                //   }}
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!messages}
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