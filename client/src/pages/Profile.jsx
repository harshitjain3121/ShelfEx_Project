import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FaEdit, FaUserPlus, FaUserCheck, FaUserMinus } from 'react-icons/fa'
import { IoImageOutline } from 'react-icons/io5'
import ProfileImage from '../components/ProfileImage'
import FeedSkeleton from '../components/FeedSkeleton'
import Feeds from '../components/Feeds'
import { userActions } from '../store/user-slice'
import { suggestionActions } from '../store/suggestion-slice'
import axios from 'axios'

const Profile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    profilePhoto: null
  })
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const currentUser = useSelector(state => state?.user?.currentUser?.user)
  const token = useSelector(state => state?.user?.currentUser?.token)

  const isOwnProfile = currentUser && currentUser.id === id

  useEffect(() => {
    if (id) {
      fetchUserProfile()
      fetchUserPosts()
    }
  }, [id])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${id}`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setUser(response.data)
      setIsFollowing(response.data.isFollowing || false)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    setIsPostsLoading(true)
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${id}/posts`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setPosts(response.data || [])
      
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setPosts([])
    } finally {
      setIsPostsLoading(false)
    }
  }

  const handleFollowUnfollow = async () => {
    if (isFollowLoading || isOwnProfile) return

    setIsFollowLoading(true)
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${id}/follow-unfollow`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      
      // Update follower count immediately for better UX
      setUser(prev => prev ? {
        ...prev,
        followersCount: newFollowingState 
          ? (prev.followersCount || 0) + 1 
          : Math.max((prev.followersCount || 0) - 1, 0)
      } : null)
      
      // Always refresh suggestions after follow/unfollow
      if (user && user.role === 'Celebrity') {
        dispatch(suggestionActions.refreshCelebritySuggestions())
      }
      
      // Update Redux state to reflect changes in navbar, sidebar, and suggestions
      if (currentUser) {
        let updatedFollowing = [...currentUser.following]
        if (newFollowingState) {
          // Follow: add id if not present
          if (!updatedFollowing.includes(id)) updatedFollowing.push(id)
        } else {
          // Unfollow: remove id
          updatedFollowing = updatedFollowing.filter(fId => fId !== id)
        }
        const updatedCurrentUser = {
          ...currentUser,
          following: updatedFollowing
        }
        const updatedUserData = {
          token: token,
          user: updatedCurrentUser
        }
        dispatch(userActions.changeCurrentUser(updatedUserData))
        localStorage.setItem("currentUser", JSON.stringify(updatedUserData))
      }
      
      console.log(response.data.message)
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      // Revert the state if the API call failed
      setIsFollowing(!isFollowing)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleEditProfile = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName,
        bio: user.bio || '',
        profilePhoto: null
      })
      setIsEditModalOpen(true)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setIsEditLoading(true)
    setEditError('')

    try {
      const formData = new FormData()
      formData.append('fullName', editForm.fullName)
      formData.append('bio', editForm.bio)
      if (editForm.profilePhoto) {
        formData.append('profilePhoto', editForm.profilePhoto)
      }

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/${currentUser.id}`,
        formData,
        {
          withCredentials: true,
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Update the user state with the new data
      setUser(response.data)
      setIsEditModalOpen(false)
      setEditForm({ fullName: '', bio: '', profilePhoto: null })
      
      // Update Redux state to reflect changes in navbar and sidebar
      if (isOwnProfile) {
        const updatedCurrentUser = {
          ...currentUser,
          fullName: response.data.fullName,
          bio: response.data.bio,
          profilePhoto: response.data.profilePhoto
        }
        
        const updatedUserData = {
          token: token,
          user: updatedCurrentUser
        }
        
        dispatch(userActions.changeCurrentUser(updatedUserData))
        localStorage.setItem("currentUser", JSON.stringify(updatedUserData))
      }
      
      // Refresh the profile data to get updated counts
      await fetchUserProfile()
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setEditError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setEditError('Image size should be less than 5MB')
        return
      }
      setEditForm(prev => ({ ...prev, profilePhoto: file }))
      setEditError('')
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <FeedSkeleton />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>User not found</h2>
          <p>The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar">
            <ProfileImage image={user.profilePhoto} />
            {/* {isOwnProfile && (
              <button 
                className="profile-edit-avatar"
                onClick={() => document.getElementById('profile-photo-input')?.click()}
              >
                <IoImageOutline />
              </button>
            )} */}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-main-info">
            <h1>{user.fullName}</h1>
            <span className={`profile-role ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
            <p className="profile-email">{user.email}</p>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-number">{user.postsCount || posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{user.followersCount || 0}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{user.followingCount || 0}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button 
                className="profile-edit-btn"
                onClick={handleEditProfile}
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowUnfollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <span className="loading-spinner"></span>
                ) : isFollowing ? (
                  <>
                    <FaUserMinus />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-posts">
          <h2>Posts</h2>
          {isPostsLoading ? (
            <FeedSkeleton />
          ) : posts.length > 0 ? (
            <Feeds posts={posts} onSetPosts={setPosts} />
          ) : (
            <div className="profile-no-posts">
              <div className="no-posts-icon">
                <IoImageOutline />
              </div>
              <h3>No posts yet</h3>
              <p>{isOwnProfile ? "Start sharing your thoughts and images!" : "This user hasn't posted anything yet."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="edit-profile-modal" onClick={() => setIsEditModalOpen(false)}>
          <div className="edit-profile-container" onClick={(e) => e.stopPropagation()}>
            <div className="edit-profile-header">
              <h3>Edit Profile</h3>
              <button 
                className="edit-profile-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="edit-profile-form">
              {editError && (
                <div className="edit-profile-error">
                  {editError}
                </div>
              )}

              <div className="edit-profile-photo">
                <label>Profile Photo</label>
                <div className="edit-photo-preview">
                  <ProfileImage 
                    image={editForm.profilePhoto ? URL.createObjectURL(editForm.profilePhoto) : user.profilePhoto} 
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('profile-photo-input')?.click()}
                    className="change-photo-btn"
                  >
                    <IoImageOutline />
                    <span>Change Photo</span>
                  </button>
                </div>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="edit-profile-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="edit-profile-field">
                <label>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">
                  {editForm.bio.length}/500 characters
                </div>
              </div>

              <div className="edit-profile-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="save-btn"
                >
                  {isEditLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile