/* eslint-disable jsx-a11y/alt-text */
import React, { Fragment } from 'react';
import { Dialog, Transition } from "@headlessui/react";

interface DeleteComponentProps {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void,
    onSuccess: () => void
}
const DeleteComponent: React.FC<DeleteComponentProps> = ({ open, title, message, onClose, onSuccess }) => {
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50"
                onClose={onClose}
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

                                <div className='py-2 text-xl text-gray-500'>
                                    {title}
                                </div>
                                <div className='py-2 text-sm text-gray-400'>
                                    {message}
                                </div>
                                <div className="mt-[2rem] flex justify-between items-center gap-4">
                                    <button
                                        type="submit"
                                        className="w-6/12 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                                        onClick={onClose}
                                    >Close</button>
                                    <button
                                        type="submit"
                                        className="w-6/12 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        onClick={onSuccess}
                                    >Ok</button>

                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default DeleteComponent;