import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    // console.log("reached");
    
    const [socket, setSocket] = useState(null);
    const currentUser = useSelector(state => state.user.currentUser?.user);
    useEffect(() => {
        if (!currentUser) return;
        const Socket = io(`http://localhost:3333`, {
            transports: ["websocket"],
            auth: {
                token: localStorage.getItem("token"),
            },
            query:{
                userId: currentUser.id
            },
            methods: ["GET", "POST"],
            allowedHeaders: ["Authorization"],
            credentials: true,
        });
        setSocket(Socket);
        return () => {
            Socket.disconnect();
        };
    }, [currentUser]);
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};