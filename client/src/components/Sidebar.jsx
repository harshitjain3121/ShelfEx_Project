import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AiOutlineHome } from "react-icons/ai"
import { IoSearch } from "react-icons/io5"
import { PiPaintBrushBold } from 'react-icons/pi'
import { BiEdit } from 'react-icons/bi'
import { FaUser } from 'react-icons/fa'
import { IoNotificationsOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { uiSliceActions } from '../store/ui-slice'
import ProfileImage from './ProfileImage'

const Sidebar = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const currentUser = useSelector(state => state?.user?.currentUser?.user)
  const notificationList = useSelector(state => state.user.notificationList)
  const notificationCount = notificationList.filter(n => !n.isRead).length

  const openThemeModel = () => {
    dispatch(uiSliceActions.openThemeModal())
  }

  const openNotificationModal = () => {
    dispatch(uiSliceActions.openNotificationModal())
  }

  // Check if current path matches user's profile
  const isProfileActive = currentUser && location.pathname === `/users/${currentUser.id}`

  return (
    <menu className="sidebar">
      <div className="sidebar__nav">
        <NavLink to="/" className={({isActive}) => `sidebar__item ${isActive ? "active" : ""}`}>
          <i className='sidebar__icon'><AiOutlineHome /></i>
          <p>Home</p>
        </NavLink>
        <NavLink to="/search" className={({isActive}) => `sidebar__item ${isActive ? "active" : ""}`}>
          <i className='sidebar__icon'><IoSearch /></i>
          <p>Search</p>
        </NavLink>
        <NavLink to="/create-post" className={({isActive}) => `sidebar__item ${isActive ? "active" : ""}`}>
          <i className='sidebar__icon'><BiEdit /></i>
          <p>Create Post</p>
        </NavLink>
        <button className="sidebar__item" onClick={openNotificationModal} style={{ position: 'relative' }}>
          <i className='sidebar__icon'><IoNotificationsOutline />
            {notificationCount > 0 && (
              <span className="sidebar__notification-badge">{notificationCount}</span>
            )}
          </i>
          <p>Notifications</p>
        </button>
        <button className="sidebar__item" onClick={openThemeModel} type="button">
          <i className='sidebar__icon'><PiPaintBrushBold /></i>
          <p>Themes</p>
        </button>
        {/* Profile icon for mobile nav only, after Themes */}
        {currentUser && (
          <NavLink
            to={`/users/${currentUser.id}`}
            className={({isActive}) => `sidebar__item sidebar__item--profile-icon ${isActive ? "active" : ""}`}
          >
            <span className="sidebar__icon sidebar__icon--avatar">
              {currentUser.profilePhoto ? (
                <img src={currentUser.profilePhoto} alt="avatar" className="sidebar__avatar-img" />
              ) : (
                <FaUser />
              )}
            </span>
            <p>Profile</p>
          </NavLink>
        )}
      </div>

      {currentUser && (
        <div className="sidebar__profile">
          <NavLink 
            to={`/users/${currentUser.id}`} 
            className={`sidebar__profile-link ${isProfileActive ? "active" : ""}`}
          >
            <div className="sidebar__profile-avatar">
              <ProfileImage image={currentUser.profilePhoto} />
            </div>
            <div className="sidebar__profile-info">
              <h4>{currentUser.fullName}</h4>
              <span className={`sidebar__profile-role ${currentUser.role.toLowerCase()}`}>
                {currentUser.role}
              </span>
            </div>
            <i className="sidebar__profile-icon">
              <FaUser />
            </i>
          </NavLink>
        </div>
      )}
    </menu>
  )
}

export default Sidebar