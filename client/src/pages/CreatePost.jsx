import React, { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoImageOutline } from 'react-icons/io5'
import ProfileImage from '../components/ProfileImage'
import axios from 'axios'

const CreatePost = () => {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  
  const currentUser = useSelector(state => state?.user?.currentUser?.user)
  const token = useSelector(state => state?.user?.currentUser?.token)

  // Check if user is a celebrity
  if (!currentUser || currentUser.role !== 'Celebrity') {
    return (
      <div className="create-post-page">
        <div className="create-post-access-denied">
          <h2>Access Denied</h2>
          <p>Only celebrities can create posts. Please log in with a celebrity account.</p>
        </div>
      </div>
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB')
        return
      }
      
      setImage(file)
      setError('')
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Allow posts with just content, just image, or both
    if (!content.trim() && !image) {
      setError('Please add some content or an image to your post')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      
      // Send 'body' field (server expects this name)
      // For image-only posts, send an empty string
      const postBody = content.trim() || ""
      formData.append('body', postBody)
      
      // Only append image if it exists
      if (image) {
        formData.append('image', image)
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts`,
        formData,
        {
          withCredentials: true,
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      console.log('Post created successfully:', response.data)
      
      // Reset form
      setContent('')
      setImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Navigate to home page
      navigate('/')
      
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.response?.data?.message || 'Failed to create post. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <div className="create-post-header">
          <h2>Create New Post</h2>
          <p>Share your thoughts, images, or both with your followers</p>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          {error && (
            <div className="create-post-error">
              {error}
            </div>
          )}

          <div className="create-post-author">
            <ProfileImage image={currentUser.profilePhoto} />
            <div className="create-post-author-info">
              <h4>{currentUser.fullName}</h4>
              <span className="celebrity-badge">Celebrity</span>
            </div>
          </div>

          <div className="create-post-content">
            <textarea
              placeholder="What's on your mind? (Text is optional if you're adding an image)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={1000}
            />
            <div className="create-post-char-count">
              {content.length}/1000 characters
            </div>
          </div>

          {imagePreview && (
            <div className="create-post-image-preview">
              <img src={imagePreview} alt="Preview" loading="lazy" />
              <button
                type="button"
                onClick={removeImage}
                className="remove-image-btn"
              >
                ×
              </button>
            </div>
          )}

          <div className="create-post-actions">
            <div className="create-post-attachments">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="attachment-btn add-image-btn"
              >
                <IoImageOutline />
                <span>Add Image</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!content.trim() && !image)}
              className="create-post-submit-btn"
            >
              {isLoading ? 'Creating...' : (content.trim() || image ? 'Create Post' : 'Add content or image')}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </form>
      </div>
    </div>
  )
}

export default CreatePost 