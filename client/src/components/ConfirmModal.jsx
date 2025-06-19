import React from 'react'

const ConfirmModal = ({ isOpen, title = 'Are you sure?', message = '', onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel' }) => {
  if (!isOpen) return null
  return (
    <div className="confirm-modal" onClick={onCancel}>
      <div className="confirm-modal__container" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal__header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal__body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal__actions">
          <button className="btn danger" onClick={onConfirm}>{confirmText}</button>
          <button className="btn" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal 