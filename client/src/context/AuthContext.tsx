// import React, { useCallback, useState } from "react";
// import { AuthContextType, AuthContextTypeDefaultValue } from './AuthContextType';

// const AuthContext = React.createContext<AuthContextType | null>(AuthContextTypeDefaultValue);
// const useAuthContext = () => React.useContext<AuthContextType | null>(AuthContext);

// const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [context, setContext] = useState(AuthContextTypeDefaultValue.context)
//     const updateAuthContext = useCallback((updatedContext: any) => {
//         setContext({
//             ...context,
//             ...updatedContext
//         })
//     }, [context]);

//     return (
//         <AuthContext.Provider value={{ context, updateAuthContext }}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

// export { useAuthContext }
// export default AuthProvider;

import React, { useCallback, useState } from "react";
import { AuthContextDTO } from "./AuthContextType";
import { LocalStorage } from "../Utils/LocalStorage";
import { USER_STORAGE } from "../constant/Constant";

const AuthContext = React.createContext<{
    context: AuthContextDTO | null;
    updateAuthContext: (context: any) => Promise<void>;
}>({
    context: LocalStorage.get(USER_STORAGE),
    updateAuthContext: async () => {},
});
const useAuthContext = () => React.useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [context, setContext] = useState(null)
    const updateAuthContext = async (updatedContext: any) => {
        setContext({
            ...updatedContext
        })
    };

    return (
        <AuthContext.Provider value={{ context, updateAuthContext }}>
            {children}
        </AuthContext.Provider>
    )
}

export { useAuthContext }
export default AuthProvider;

