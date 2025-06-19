import React from 'react'
import { useDispatch } from 'react-redux'
import { uiSliceActions } from '../store/ui-slice'
import { useNavigate } from 'react-router-dom'

const NotificationModal = ({ notifications = [], onMarkAllRead }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleNotificationClick = (notif, idx) => {
    if (!notif.isRead) {
      // Mark as read in Redux
      const updated = notifications.map((n, i) => i === idx ? { ...n, isRead: true } : n);
      dispatch({ type: 'user/setNotifications', payload: updated });
    }
    // Always try to navigate if celebrityId exists
    if (notif.celebrityId) {
      dispatch(uiSliceActions.closeNotificationModal())
      navigate(`/users/${notif.celebrityId}`)
    }
  }

  const closeNotificationModal = e => {
    if (e.target.classList.contains('notification-modal')) {
      dispatch(uiSliceActions.closeNotificationModal())
    }
  }

  return (
    <section className='notification-modal' onClick={closeNotificationModal}>
      <div className='notification-modal__container'>
        <div className='notification-modal__header'>
          <h3>Notifications</h3>
          <button className='notification-modal__close' onClick={() => dispatch(uiSliceActions.closeNotificationModal())}>×</button>
        </div>
        <div className='notification-modal__list'>
          {notifications.length === 0 ? (
            <div className='notification-modal__empty'>No notifications yet.</div>
          ) : (
            notifications.map((notif, idx) => (
              <div
                key={idx}
                className={`notification-modal__item${notif.isRead ? '' : ' unread'}`}
                style={{ cursor: notif.celebrityId ? 'pointer' : 'default' }}
                onClick={() => handleNotificationClick(notif, idx)}
              >
                {notif.message || notif.text}
                <span className='notification-modal__time'>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : notif.time}</span>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <button className='notification-modal__mark-all' onClick={onMarkAllRead}>Mark all as read</button>
        )}
      </div>
    </section>
  )
}

export default NotificationModal 