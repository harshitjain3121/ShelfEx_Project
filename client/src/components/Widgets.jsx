import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import ProfileImage from './ProfileImage'
import { FaUserPlus } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { suggestionActions } from '../store/suggestion-slice'
import { userActions } from '../store/user-slice'

const Widgets = () => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState({})
  const token = useSelector(state => state?.user?.currentUser?.token)
  const currentUser = useSelector(state => state?.user?.currentUser?.user)
  const refreshCelebritySuggestionsCount = useSelector(state => state?.suggestion?.refreshCelebritySuggestionsCount)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    fetchCelebritySuggestions()
    // eslint-disable-next-line
  }, [currentUser, refreshCelebritySuggestionsCount])

  const fetchCelebritySuggestions = async () => {
    if (!token || !currentUser) return
    setLoading(true)
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?query=`,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      )
      // Only celebrities not already followed
      let celebrities = res.data.filter(
        user => user.role === 'Celebrity' && !currentUser.following.includes(user._id) && user._id !== currentUser.id
      )
      // Shuffle and take 10
      celebrities = celebrities.sort(() => 0.5 - Math.random()).slice(0, 10)
      setSuggestions(celebrities)
    } catch (err) {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (celebrityId) => {
    if (followLoading[celebrityId]) return
    setFollowLoading(prev => ({ ...prev, [celebrityId]: true }))
    try {
      await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${celebrityId}/follow-unfollow`,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      )
      setSuggestions(prev => prev.filter(user => user._id !== celebrityId))
      // Update Redux currentUser.following
      if (currentUser) {
        let updatedFollowing = [...currentUser.following]
        if (!updatedFollowing.includes(celebrityId)) updatedFollowing.push(celebrityId)
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
      // Optionally refresh suggestions
      dispatch(suggestionActions.refreshCelebritySuggestions())
    } catch (err) {
      // handle error
    } finally {
      setFollowLoading(prev => ({ ...prev, [celebrityId]: false }))
    }
  }

  return (
    <div className="widgets">
      <div className="friendRequests">
        <h3>Suggested Celebrities</h3>
        {loading ? (
          <p>Loading...</p>
        ) : suggestions.length === 0 ? (
          <p>No suggestions right now.</p>
        ) : (
          suggestions.map(user => (
            <div
              className="friendRequest"
              key={user._id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/users/${user._id}`)}
            >
              <div className="friendRequest__info">
                <div className="friendRequest__image">
                  <ProfileImage image={user.profilePhoto} />
                </div>
                <div>
                  <h4>{user.fullName}</h4>
                  <span className="celebrity-badge">Celebrity</span>
                </div>
              </div>
              <div className="friendRequest__actions">
                <button
                  className="friendRequest__actions-approve"
                  onClick={e => { e.stopPropagation(); handleFollow(user._id) }}
                  disabled={followLoading[user._id]}
                  title="Follow"
                >
                  {followLoading[user._id] ? <span className="loading-spinner"></span> : <FaUserPlus />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Widgets