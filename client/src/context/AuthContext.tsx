import React, { useState } from "react";
import { LocalStorage } from "../Utils/LocalStorage";
import { USER_STORAGE } from "../constant/Constant";
import { UserDTO } from "../interface/User.interface";

const AuthContext = React.createContext<{
    context: UserDTO | undefined;
    updateAuthContext: (context: UserDTO) => Promise<void>;
}>({
    context: LocalStorage.get(USER_STORAGE),
    updateAuthContext: async () => {},
});
const useAuthContext = () => React.useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<UserDTO>({} as UserDTO)
    const updateAuthContext = async (updatedContext: UserDTO) => {
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

