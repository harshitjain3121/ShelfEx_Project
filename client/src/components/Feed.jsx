import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaEllipsisH, FaEdit, FaTrash } from 'react-icons/fa'
import ProfileImage from './ProfileImage'
import TimeAgo from 'react-timeago'
import axios from 'axios'
import ConfirmModal from './ConfirmModal'

const Feed = ({ post, onSetPosts }) => {
  const [creator, setCreator] = useState({})
  const [isLiked, setIsLiked] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const menuRef = useRef(null)
  const imageRef = useRef(null)
  const token = useSelector(state => state?.user?.currentUser?.token)
  const currentUser = useSelector(state => state?.user?.currentUser?.user)

  // Strict 1-second delay before loading
  useEffect(() => {
    if (!post?.image) return

    // Always wait 1 second before loading
    const timeoutId = setTimeout(() => {
      setShouldLoad(true)
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [post?.image])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const getPostCreator = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${post?.creator}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      setCreator(response?.data)
    } catch (error) {
      console.log(error)
    }
  }

  const checkIfLiked = () => {
    if (post?.likes && currentUser) {
      setIsLiked(post.likes.includes(currentUser.id))
    }
  }

  const handleLike = async () => {
    if (isLikeLoading) return

    setIsLikeLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${post._id}/like`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update the post in the parent component
      if (onSetPosts) {
        onSetPosts(prevPosts => 
          prevPosts.map(p => 
            p._id === post._id ? response.data : p
          )
        )
      }
      
      setIsLiked(!isLiked)
    } catch (error) {
      console.log('Error liking post:', error)
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleEditPost = async () => {
    if (!editContent.trim()) return

    setIsEditLoading(true)
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/posts/${post._id}`, {
        body: editContent
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update the post in the parent component
      if (onSetPosts) {
        onSetPosts(prevPosts => 
          prevPosts.map(p => 
            p._id === post._id ? response.data : p
          )
        )
      }
      
      setIsEditing(false)
      setEditContent('')
    } catch (error) {
      console.log('Error editing post:', error)
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleDeletePost = async () => {
    setShowConfirmModal(true)
  }

  const confirmDeletePost = async () => {
    setShowConfirmModal(false)
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${post._id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      // Remove the post from the parent component
      if (onSetPosts) {
        onSetPosts(prevPosts => prevPosts.filter(p => p._id !== post._id))
      }
    } catch (error) {
      console.log('Error deleting post:', error)
    }
  }

  const startEditing = () => {
    setEditContent(post.body || '')
    setIsEditing(true)
    setIsMenuOpen(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const toggleMenu = (e) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false)
    }
  }

  const isOwnPost = currentUser && post?.creator === currentUser.id

  useEffect(() => {
    getPostCreator()
    checkIfLiked()
  }, [post])

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <article className='feed'>
      <header className="feed__header">
        <Link to={`/users/${post?.creator}`} className='feed__header-profile'>
          <ProfileImage image={creator?.profilePhoto} />
          <div className="feed__header-details">
            <h4>{creator?.fullName}</h4>
            <small><TimeAgo date={post?.createdAt} /></small>
          </div>
        </Link>
        
        {isOwnPost && (
          <div className="feed__header-menu" ref={menuRef}>
            <button onClick={toggleMenu} className="feed__menu-toggle">
              <FaEllipsisH />
            </button>
            {isMenuOpen && (
              <div className="feed__menu-dropdown">
                <button onClick={startEditing} className="feed__menu-item edit">
                  <FaEdit /> Edit Post
                </button>
                <button onClick={handleDeletePost} className="feed__menu-item delete">
                  <FaTrash /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {isEditing ? (
        <div className="feed__edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your post..."
            rows={3}
          />
          <div className="feed__edit-actions">
            <button onClick={handleEditPost} disabled={isEditLoading} className="feed__edit-save">
              {isEditLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={cancelEditing} disabled={isEditLoading} className="feed__edit-cancel">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {post?.body && (
            <div className="feed__content">
              <p>{post.body}</p>
            </div>
          )}

          {post?.image && (
            <div className="feed__images" ref={imageRef}>
              {!shouldLoad && (
                <div className="feed__image-skeleton">
                  <div className="feed__image-placeholder"></div>
                </div>
              )}
              
              {shouldLoad && !imageLoaded && !imageError && (
                <div className="feed__image-loading">
                  <div className="feed__image-spinner"></div>
                  <span>Loading image...</span>
                </div>
              )}
              
              {shouldLoad && imageError && (
                <div className="feed__image-error">
                  <span>Failed to load image</span>
                </div>
              )}
              
              {shouldLoad && (
                <img
                  src={post.image}
                  alt="Post"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-out',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    display: imageLoaded ? 'block' : 'none'
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      <footer className="feed__footer">
        <div>
          <button onClick={handleLike} disabled={isLikeLoading} className="feed__like-btn">
            {isLiked ? <FaHeart style={{ color: 'var(--color-primary)' }} /> : <FaRegHeart />}
            <small>{post?.likes?.length || 0}</small>
          </button>
        </div>
      </footer>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDeletePost}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </article>
  )
}

export default Feed