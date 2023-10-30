import React from 'react';

const ToastComponent: React.FC<{ type: string, message: string }> = ({ type, message }) => {

    const ToastMessage = () => {
        const bgcolor = type === 'success' ? 'bg-green-700' : 'bg-red-700';
        const badgecolor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const msg = type === 'success' ? 'Success' : 'Error';
        return (
            <div className={`p-2 ${bgcolor} items-center text-indigo-100 leading-none rounded-full flex lg:inline-flex`} role="alert">
                <span className={`flex rounded-full ${badgecolor} uppercase px-2 py-1 text-xs font-bold mr-3`}>{msg}</span>
                <span className="font-normal text-sm text-gray-300 mr-2 text-left flex-auto">{message}</span>
            </div>
        )

    }
    return (
        <div className="fixed z-[999] top-0 right-0 text-white p-4 rounded-lg text-center">
            <ToastMessage />
        </div>
    )
}

export default ToastComponent;
