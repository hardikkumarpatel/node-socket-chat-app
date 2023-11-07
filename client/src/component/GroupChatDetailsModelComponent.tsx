import { Dialog, Transition } from "@headlessui/react";
import {
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import React, { Fragment, useEffect, useState } from "react";
import { GET_GROUP_CHAT_DETAILS_BY_ID_URL, RENAME_GROUP_CHAT_URL, USERS_LIST_URL } from "../constant/Endpoint.constant";
import { LocalStorage } from "../Utils/LocalStorage";
import { USER_STORAGE } from "../constant/Constant";
import { ClientApiResponseDTO } from "../interface/Common.interface";
import { ChatAndParticipentsDTO, ChatParticipentDTO } from "../interface/Chat.interface";
import { useToastContext } from "../context/ToastContext";
import { UserDAO } from "../interface/User.interface";
import { useAuthContext } from "../context/AuthContext";
import SelectComponent from "./SelectComponent";

const GroupChatDetailsModalComponent: React.FC<{
  open: boolean;
  onClose: () => void;
  chatID: string;
  onGroupDelete: () => void;
}> = ({ open, onClose, chatID, onGroupDelete }) => {
  const { context } = useAuthContext();
  const { toast } = useToastContext();
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [renamingGroup, setRenamingGroup] = useState(false);
  const [participantToBeAdded, setParticipantToBeAdded] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupDetails, setGroupDetails] =
    useState<ChatAndParticipentsDTO | null>(null);
  const [users, setUsers] = useState<UserDAO[]>([]);

  const handleGroupNameUpdate = async () => {
    if (!newGroupName) {
      return toast('error', "Group name is required")
    }

    try {
      const users = await fetch(`${RENAME_GROUP_CHAT_URL}/${chatID}`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
        },
        body: JSON.stringify({ name: newGroupName })
      });
      const { success, message, data } = await users.json() as ClientApiResponseDTO<ChatAndParticipentsDTO>;
      if (!success) {
        return toast('error', message)
      }
      toast('success', message);
      setGroupDetails(data);
      setNewGroupName(data.name);
      setRenamingGroup(false);
    } catch (Exception: any) {
      toast('error', Exception.message);
    }
  };

  const removeParticipant = async (participantId: string) => {
    // requestHandler(
    //   // This is the main request function to remove a participant from the group.
    //   async () => await removeParticipantFromGroup(chatId, participantId),
    //   // Null represents an optional loading state callback
    //   null,
    //   // This is the callback after the request is successful.
    //   () => {
    //     // Copy the existing group details.
    //     const updatedGroupDetails = {
    //       ...groupDetails,
    //       // Update the participants list by filtering out the removed participant.
    //       participants:
    //         (groupDetails?.participants &&
    //           groupDetails?.participants?.filter(
    //             (p) => p._id !== participantId
    //           )) ||
    //         [],
    //     };
    //     // Update the state with the modified group details.
    //     setGroupDetails(updatedGroupDetails as ChatListItemInterface);
    //     // Inform the user that the participant has been removed.
    //     alert("Participant removed");
    //   },
    //   // This may be a generic error alert or error handling function if the request fails.
    //   alert
    // );
  };

  // Function to add a participant to a chat group.
  const addParticipant = async () => {
    // Check if there's a participant selected to be added.
    if (!participantToBeAdded)
      return alert("Please select a participant to add.");
    // Make a request to add the participant to the group.
    // requestHandler(
    //   // Actual request to add the participant.
    //   async () => await addParticipantToGroup(chatId, participantToBeAdded),
    //   // No loading callback provided, so passing `null`.
    //   null,
    //   // Callback on success.
    //   (res) => {
    //     // Destructure the response to get the data.
    //     const { data } = res;
    //     // Create an updated group details object.
    //     const updatedGroupDetails = {
    //       ...groupDetails,
    //       participants: data?.participants || [],
    //     };
    //     // Update the group details state with the new details.
    //     setGroupDetails(updatedGroupDetails as ChatListItemInterface);
    //     // Alert the user that the participant was added.
    //     alert("Participant added");
    //   },
    //   // Use the `alert` function as the fallback error handler.
    //   alert
    // );
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    const fetchGroupInformation = async () => {
      try {
        const res = await fetch(`${GET_GROUP_CHAT_DETAILS_BY_ID_URL}/${chatID}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`,
          }
        });
        const { success, message, data } = await res.json() as ClientApiResponseDTO<ChatAndParticipentsDTO>;
        if (!success) {
          toast('error', message);
          return true;
        }
        setGroupDetails(data);
        setNewGroupName(data.name || "");
      } catch (ErrorException: any) {
        toast('error', ErrorException.message)
      }
    };

    const getUsers = async () => {
      try {
        const users = await fetch(USERS_LIST_URL, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LocalStorage.get(USER_STORAGE)['accessToken']}`
          }
        });
        const { data } = await users.json() as ClientApiResponseDTO<UserDAO[]>;
        setUsers(data)
      } catch (Exception: any) {
        toast('error', Exception.message);
      }
    };
    fetchGroupInformation();
    getUsers();
  }, [chatID, toast]); // The effect is dependent on the 'open' state or prop, so it re-runs whenever 'open' changes

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-500 sm:duration-700"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transform transition ease-in-out duration-500 sm:duration-700"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto bg-white w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-secondary py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-full bg-transparent py-2 px-2 text-gray-400 hover:text-gray-500 hover:bg-gray-400 focus:outline-none"
                            onClick={handleClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <div className="flex flex-col justify-center items-start">
                        <div className="flex pl-16 justify-center items-center relative w-full h-max gap-3">
                          {groupDetails?.chat_participents.slice(0, 3).map((p: ChatParticipentDTO) => {
                            return (
                              <img
                                className="w-24 h-24 -ml-16 rounded-full outline-none"
                                key={p.id}
                                src={p.user.avatar_url}
                                alt="avatar"
                              />
                            );
                          })}
                          {groupDetails?.chat_participents &&
                            groupDetails?.chat_participents.length > 3 ? (
                            <p>+{groupDetails?.chat_participents.length - 3}</p>
                          ) : null}
                        </div>
                        <div className="w-full flex flex-col justify-center items-center text-center">
                          {renamingGroup ? (
                            <div className="w-full flex justify-center items-center mt-5 gap-2">
                              <input
                                placeholder="Enter new group name..."
                                type="text"
                                name="new_group_name"
                                id="new_group_name"
                                className="w-8/12  font-light bg-gray-50 border outline-none border-gray-300  rounded-lg focus:ring-primary-600 focus:border-primary-600 block py-2 px-5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                value={newGroupName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setNewGroupName(e.target.value)
                                }
                              />
                              <button
                                type="button"
                                className=" w-2/12 rounded-full bg-gray-600 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                onClick={handleGroupNameUpdate}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className=" w-2/12 rounded-full bg-gray-600  py-2 text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                onClick={() => setRenamingGroup(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="w-full inline-flex justify-center items-center text-center mt-5">
                              <h1 className="text-2xl font-semibold truncate-1 text-gray-500">
                                {groupDetails?.name}
                              </h1>
                              {groupDetails?.created_by === context?.user.id ? (
                                <button onClick={() => setRenamingGroup(true)}>
                                  <PencilIcon className="w-5 h-5 ml-4 text-gray-500" />
                                </button>
                              ) : null}
                            </div>
                          )}

                          <p className="mt-2 text-gray-400 text-sm">
                            Group · {groupDetails?.chat_participents.length}{" "}
                            participants
                          </p>
                        </div>
                        <hr className="border-[0.1px] border-gray-200 my-5 w-full" />
                        <div className="w-full">
                          <p className="inline-flex items-center text-gray-500">
                            <UserGroupIcon className="h-6 w-6 mr-2 text-gray-500" />{" "}
                            {groupDetails?.chat_participents.length} Participants
                          </p>
                          <div className="w-full">
                            {groupDetails?.chat_participents?.map((part: ChatParticipentDTO) => {
                              return (
                                <React.Fragment key={part.id}>
                                  <div className="flex justify-between items-center w-full py-4">
                                    <div className="flex justify-start items-start gap-3 w-full">
                                      <img
                                        className="h-12 w-12 rounded-full"
                                        src={part.user.avatar_url}
                                        alt={part.id}
                                      />
                                      <div>
                                        <p className="text-gray-600 font-semibold text-sm inline-flex items-center w-full">
                                          {part.user.username}{" "}
                                          {part.user.id === groupDetails.created_by ? (
                                            <span className="ml-2 text-[10px] px-4 bg-green-400 border-0 rounded-full text-success">
                                              admin
                                            </span>
                                          ) : null}
                                        </p>
                                        <small className="text-zinc-400">
                                          {part.user.email}
                                        </small>
                                      </div>
                                    </div>
                                    {groupDetails.created_by === context?.user.id ? (
                                      <div>
                                        <button
                                          type="button"
                                          className="px-5 py-1 bg-red-500 rounded-full text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                          onClick={() => {
                                            // const ok = confirm(
                                            //   "Are you sure you want to remove " +
                                            //     user.username +
                                            //     " ?"
                                            // );
                                            // if (ok) {
                                            //   removeParticipant(part.user.id || "");
                                            // }
                                            onGroupDelete()
                                          }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                  <hr className="bg-gray-700 my-1 w-full" />
                                </React.Fragment>
                              );
                            })}
                            {groupDetails?.created_by === context?.user.id ? (
                              <div className="w-full my-5 flex flex-col justify-center items-center gap-4">
                                {!addingParticipant ? (
                                  <button
                                    type="button"
                                    className="w-full rounded-full bg-gray-500 text-white flex items-center py-2 px-2 justify-center"
                                    onClick={() => setAddingParticipant(true)}
                                  >
                                    <UserPlusIcon className="w-5 h-5 mr-1" />{" "}
                                    Add participant
                                  </button>
                                ) : (
                                  <div className="w-full flex justify-start items-center gap-2">
                                    <SelectComponent
                                      placeholder="Select a user to add..."
                                      value={participantToBeAdded}
                                      options={users.map((user) => ({
                                        label: user.username,
                                        value: user.id,
                                      }))}
                                      onChange={({ value }) => {
                                        setParticipantToBeAdded(value);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="rounded-md bg-transparent text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                      onClick={() => addParticipant()}>
                                      + Add
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-md bg-transparent text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                                      onClick={() => {
                                        setAddingParticipant(false);
                                        setParticipantToBeAdded("");
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="w-full rounded-full bg-red-500 text-white flex items-center py-2 px-2 justify-center"
                                  onClick={() => onGroupDelete()}
                                >
                                  <TrashIcon className="w-5 h-5 mr-1" /> Delete
                                  group
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default GroupChatDetailsModalComponent;
