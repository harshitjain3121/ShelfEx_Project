import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {useSocket} from '../context/socketContext'
import { userActions } from '../store/user-slice'

const GetRTN = () => {
    const dispatch = useDispatch();
    const socket = useSocket();

    // Use useCallback to keep the same function reference
    const handleNotification = useCallback(
        (data) => {
            // data: { notification, unreadCount }
            dispatch(userActions.addNotification(data.notification));
        },
        [dispatch]
    );

    useEffect(() => {
        if (!socket) return;
        socket.on("notification", handleNotification);
        return () => {
            socket.off("notification", handleNotification);
        };
    }, [socket, handleNotification]);

    return null;
};

export default GetRTN;