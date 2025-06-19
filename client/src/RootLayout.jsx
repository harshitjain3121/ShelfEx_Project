import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Widgets from "./components/Widgets";
import { Outlet } from "react-router-dom";
import ThemeModal from "./components/ThemeModal";
import NotificationModal from "./components/NotificationModal";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom'
import GetRTN from "./components/GetRTN";

const RootLayout = () => {
  GetRTN();
  const { themeModalIsOpen, notificationModalIsOpen } = useSelector(
    (state) => state?.ui
  );
  const { primaryColor, backgroundColor } = useSelector(
    (state) => state?.ui?.theme
  );
  const notificationList = useSelector(state => state.user.notificationList);
  const dispatch = useDispatch();

  // Handler to mark all notifications as read
  const handleMarkAllRead = () => {
    const updated = notificationList.map(n => ({ ...n, isRead: true }));
    dispatch({ type: 'user/setNotifications', payload: updated });
  };

  useEffect(() => {
    const body = document.body;
    body.className = `${primaryColor} ${backgroundColor}`;
  }, [primaryColor, backgroundColor]);

  return (
    <>
      <Navbar />
      <main className="main">
        <div className="container main__container">
          <Sidebar />
          <Outlet />
          <Widgets />
          {themeModalIsOpen && <ThemeModal />}
          {notificationModalIsOpen && <NotificationModal notifications={notificationList} onMarkAllRead={handleMarkAllRead} />}
        </div>
      </main>
    </>
  );
};

export default RootLayout;
