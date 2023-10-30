import React, { useEffect, useState } from 'react';
import { ToastProps } from './ToastContextType';
import ToastComponent from '../component/Toast';

const ToastContext = React.createContext<{
    toast: (type: string, message: string, duration?: number) => Promise<void>
}>({
    toast: async () => { }
})
const useToastContext = () => React.useContext(ToastContext);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastProps>({
        open: false,
        type: 'success',
        message: ''
    });

    const onCloseToast = () => {
        setToast({} as ToastProps);
    };

    const openToast = async (type = 'success', message = '', duration = 3000) => {
        setToast({ open: true, type, message, duration })
    }

    useEffect(() => {
        if (toast && toast.duration) {
            const timer = setTimeout(() => {
                onCloseToast();
            }, toast.duration);

            return () => clearTimeout(timer);
        }
    }, [toast]);

    return (
        <ToastContext.Provider value={{ toast: openToast }}>
            {toast.open && (
                <ToastComponent type={toast.type} message={toast.message} />
            )}
            {children}
        </ToastContext.Provider>
    )
}
export { useToastContext };
export default ToastProvider;