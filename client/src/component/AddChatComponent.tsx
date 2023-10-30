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
import { USERS_LIST_URL } from '../constant/Endpoint.constant';
import { LocalStorage } from '../Utils/LocalStorage';
import { USER_STORAGE } from '../constant/Constant';
import { ClientApiResponse } from '../interface/Common.interface';
import { ChatUserDTO, UsersDTO } from '../interface/Chat.interface';
import { useToastContext } from '../context/ToastContext';

interface AddChatCompoentProps {
    open: boolean;
    onClose: () => void
}
const AddChatCompoent: React.FC<AddChatCompoentProps> = ({ open, onClose }) => {

    const { toast } = useToastContext();
    const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
    const [groupName, setGroupName] = useState<string>('');
    const [usersData, setUsersData] = useState<UsersDTO[]>([]);
    const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<null | string>(null);
    const [creatingChat, setCreatingChat] = useState<boolean>(false);

    const onChangeChatOptions = () => {
        setIsGroupChat(!isGroupChat);
        setGroupName('');
        setSelectedUserId(null);
        setGroupParticipants([]);
    }

    const handleClose = () => {
        setUsersData([]);
        setSelectedUserId(null);
        setGroupName("");
        setGroupParticipants([]);
        setIsGroupChat(false);
        onClose();
    };

    const onHandleCreateOnetoOneChat = useCallback(async () => {
        if (!selectedUserId) {
            return toast('Error', 'Please select a user')
        }
        setCreatingChat(true);
    }, [selectedUserId, toast]);

    const getUsersList = useCallback(async () => {
        try {
            const users = await fetch(USERS_LIST_URL, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
                }
            });
            const result = await users.json() as ClientApiResponse<ChatUserDTO>;
            setUsersData(result.data.users)
        } catch (Exception: any) {
            toast('error', Exception.message);
        }
    }, [toast]);

    useEffect(() => {
        if (!open) return;

        getUsersList()
    }, [open, getUsersList]);

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
                                            options={usersData.map((user: UsersDTO) => {
                                                return {
                                                    label: user.username,
                                                    value: user.id,
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
                                                    .filter((user: UsersDTO) =>
                                                        groupParticipants.includes(user.id)
                                                    )
                                                    ?.map((participant: UsersDTO) => {
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
                                        onClick={onHandleCreateOnetoOneChat}
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