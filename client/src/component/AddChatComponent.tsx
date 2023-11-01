/* eslint-disable jsx-a11y/alt-text */
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Dialog, Switch, Transition } from "@headlessui/react";
import {
    UserGroupIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/20/solid";
import { classNames } from '../Utils';
import SelectComponent from './SelectComponent';
import { CREATE_USER_GROUP_CHAT_URL, CREATE_USER_ONE_ON_ONE_CHAT_URL, USERS_LIST_URL } from '../constant/Endpoint.constant';
import { LocalStorage } from '../Utils/LocalStorage';
import { USER_STORAGE } from '../constant/Constant';
import { useToastContext } from '../context/ToastContext';
import { ClientApiResponseDTO } from '../interface/Common.interface';
import { UserDAO } from '../interface/User.interface';

interface AddChatCompoentProps {
    open: boolean;
    onClose: () => void,
    onSuccess: () => void
}
const AddChatCompoent: React.FC<AddChatCompoentProps> = ({ open, onClose, onSuccess }) => {

    const { toast } = useToastContext();
    const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
    const [groupName, setGroupName] = useState<string>('');
    const [usersData, setUsersData] = useState<UserDAO[]>([]);
    const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<null | string>(null);
    const [creatingChat, setCreatingChat] = useState<boolean>(false);

    const onChangeChatOptions = () => {
        setIsGroupChat(!isGroupChat);
        setGroupName('');
        setSelectedUserId(null);
        setGroupParticipants([]);
    }

    const handleClose = useCallback(() => {
        setUsersData([]);
        setSelectedUserId(null);
        setGroupName("");
        setGroupParticipants([]);
        setIsGroupChat(false);
        onClose();
    }, [onClose]);

    const onHandleCreateOnetoOneChat = useCallback(async () => {
        if (!selectedUserId) {
            return toast('Error', 'Please select a user')
        }
        setCreatingChat(true);
        const res = await fetch(`${CREATE_USER_ONE_ON_ONE_CHAT_URL}/${selectedUserId}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`,
            }
        });
        const { success, statusCode, message } = await res.json() as ClientApiResponseDTO<{}>;
        if (!success) {
            return toast('error', message)
        }
        if (statusCode === 200) {
            setCreatingChat(false);
            toast("error", message)
        }
        if (statusCode === 201) {
            setCreatingChat(false);
            toast("success", message)
            onSuccess();
            handleClose();
        }
    }, [selectedUserId, toast, onSuccess, handleClose]);


    const onHandleCreateGroupChat = useCallback(async () => {
        if (!groupName) return toast('error', "Group name is required");

        if (!groupParticipants.length || groupParticipants.length < 2)
            return toast('error', "There must be at least 2 group participants");
        setCreatingChat(true);
        const res = await fetch(`${CREATE_USER_GROUP_CHAT_URL}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`,
            },
            body: JSON.stringify({
                name: groupName,
                participents: groupParticipants
            })
        });
        const { success, message } = await res.json() as ClientApiResponseDTO<{}>;
        if (!success) {
            return toast('error', message)
        }


        setCreatingChat(false);
        toast("success", message)
        onSuccess();
        handleClose();
    }, [toast, groupName, groupParticipants, onSuccess, handleClose]);

    useEffect(() => {
        const getUsersList = async () => {
            try {
                const users = await fetch(USERS_LIST_URL, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
                    }
                });
                const result = await users.json() as ClientApiResponseDTO<UserDAO[]>;
                setUsersData(result.data)
            } catch (Exception: any) {
                toast('error', Exception.message);
            }
        };
        getUsersList()
    }, [toast]);

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10"
                onClose={handleClose}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-visible">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                className="bg-white relative transform overflow-x-hidden rounded-lg bg-dark px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6"
                                style={{
                                    overflow: "inherit",
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-center">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-gray-500"
                                        >
                                            Create chat
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="rounded-md bg-transparent text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                            onClick={handleClose}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Switch.Group as="div" className="flex items-center my-5">
                                        <Switch
                                            checked={isGroupChat}
                                            onChange={() => onChangeChatOptions()}
                                            className={classNames(
                                                isGroupChat ? "bg-gray-500" : "bg-zinc-200",
                                                "relative outline outline-[1px] outline-white inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-0"
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={classNames(
                                                    isGroupChat
                                                        ? "translate-x-5 bg-gray-200"
                                                        : "translate-x-0 bg-white",
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
                                                )}
                                            />
                                        </Switch>
                                        <Switch.Label as="span" className="ml-3 text-sm">
                                            <span
                                                className={classNames(
                                                    "font-medium text-gray-500",
                                                    isGroupChat ? "" : "opacity-40"
                                                )}
                                            >
                                                Is it a group chat?
                                            </span>{" "}
                                        </Switch.Label>
                                    </Switch.Group>
                                    {isGroupChat ? (
                                        <div className="my-5">
                                            <input type="text"
                                                name="username"
                                                id="username"
                                                className="w-full font-light bg-gray-50 border outline-none border-gray-300 text-gray-900  rounded-lg focus:ring-primary-600 focus:border-primary-600 block py-4 px-5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                placeholder="group name"
                                                value={groupName}
                                                onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => setGroupName(value)}
                                            />

                                        </div>
                                    ) : null}
                                    <div className="my-5">
                                        <SelectComponent
                                            placeholder={
                                                isGroupChat
                                                    ? "Select group participants"
                                                    : "Select a user to chat"
                                            }
                                            value={isGroupChat ? "" : selectedUserId || ""}
                                            options={usersData.map(({ username, id }: UserDAO) => {
                                                return {
                                                    label: username,
                                                    value: id,
                                                };
                                            })}
                                            onChange={({ value }) => {
                                                if (isGroupChat && !groupParticipants.includes(value)) {
                                                    setGroupParticipants([...groupParticipants, value]);
                                                } else {
                                                    setSelectedUserId(value);
                                                }
                                            }}
                                        />
                                    </div>
                                    {isGroupChat ? (
                                        <div className="my-5">
                                            <span
                                                className={classNames(
                                                    "font-medium text-gray-500 inline-flex items-center"
                                                )}
                                            >
                                                <UserGroupIcon className="h-5 w-5 mr-2" /> Selected
                                                participants
                                            </span>{" "}
                                            <div className="flex justify-start items-center flex-wrap gap-2 mt-3">
                                                {usersData
                                                    .filter((user: UserDAO) =>
                                                        groupParticipants.includes(user.id)
                                                    )
                                                    ?.map((participant: UserDAO) => {
                                                        return (
                                                            <div
                                                                className="inline-flex bg-secondary rounded-full p-2 border outline-none border-gray-300 items-center gap-2"
                                                                key={participant.id}
                                                            >
                                                                <img
                                                                    className="h-6 w-6 rounded-full object-cover"
                                                                    src={participant.avatar_url}
                                                                />
                                                                <p className="text-gray-600 font-light">
                                                                    {participant.username}
                                                                </p>
                                                                <XCircleIcon
                                                                    role="button"
                                                                    className="w-6 h-6 hover:text-primary cursor-pointer"
                                                                    onClick={() => {
                                                                        setGroupParticipants(
                                                                            groupParticipants.filter(
                                                                                (p) => p !== participant.id
                                                                            )
                                                                        );
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="mt-5 flex justify-between items-center gap-4">
                                    <button
                                        disabled={creatingChat}
                                        type="submit"
                                        className="w-6/12 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                                        onClick={handleClose}
                                    >Close</button>
                                    <button
                                        disabled={creatingChat}
                                        type="submit"
                                        className="w-6/12 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        onClick={isGroupChat ? onHandleCreateGroupChat : onHandleCreateOnetoOneChat}
                                    >Create</button>

                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default AddChatCompoent;