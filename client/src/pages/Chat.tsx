import React, { useState } from "react";
import AddChatCompoent from "../component/AddChatComponent";

const ChatPage: React.FC<{}> = () => {
    const [openAddChatDialog, setOpenAddChatDialog] = useState<boolean>(false);
    return (
        <>
          <AddChatCompoent
          open={openAddChatDialog}
          onClose={() => setOpenAddChatDialog(false)}
          />
            <div className="w-full justify-between items-stretch h-screen flex flex-shrink-0">
                <div className="w-3/12 relative bg-white shadow overflow-y-auto px-4">
                    <div className="z-10 w-full sticky top-0 bg-dark py-4 flex justify-between items-center gap-4">
                      <input type="text" name="username" id="username" className="w-8/12  bg-gray-50 border outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required />
                      <button 
                      type="submit" 
                      className="w-4/12 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                      onClick={() => setOpenAddChatDialog(true)}
                      >Add Chat</button>
                    </div>
                </div>
                <div className="w-9/12 border-l-[0.1px] border-secondary">
                    F
                </div>
            </div>
        </>
    )
}

export default ChatPage;