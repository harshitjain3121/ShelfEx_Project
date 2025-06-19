import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { IoSearch } from 'react-icons/io5'
import { FaUserPlus, FaUserMinus } from 'react-icons/fa'
import ProfileImage from '../components/ProfileImage'
import axios from 'axios'
import { suggestionActions } from '../store/suggestion-slice'
import { userActions } from '../store/user-slice'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [followingStatus, setFollowingStatus] = useState({})
  const [isFollowingLoading, setIsFollowingLoading] = useState({})
  const token = useSelector(state => state?.user?.currentUser?.token)
  const currentUserId = useSelector(state => state?.user?.currentUser?.user?.id)
  const currentUser = useSelector(state => state?.user?.currentUser?.user)
  const dispatch = useDispatch()

  const searchCelebrities = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?query=${encodeURIComponent(query)}`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      // Filter to show only celebrities
      const celebrities = response.data.filter(user => user.role === 'Celebrity')
      setSearchResults(celebrities)
      
      // Check following status for each celebrity
      checkFollowingStatus(celebrities)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const checkFollowingStatus = async (celebrities) => {
    const status = {}
    for (const celebrity of celebrities) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/${celebrity._id}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        status[celebrity._id] = response.data.isFollowing
      } catch (error) {
        console.error('Error checking following status:', error)
        status[celebrity._id] = false
      }
    }
    setFollowingStatus(status)
  }

  const handleFollowUnfollow = async (celebrityId, celebrityName) => {
    if (isFollowingLoading[celebrityId]) return

    setIsFollowingLoading(prev => ({ ...prev, [celebrityId]: true }))
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/${celebrityId}/follow-unfollow`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      // Update following status
      setFollowingStatus(prev => {
        const wasFollowing = prev[celebrityId]
        const nowFollowing = !wasFollowing
        // If unfollowed, refresh suggestions
        if (!nowFollowing) {
          dispatch(suggestionActions.refreshCelebritySuggestions())
        }
        // Update Redux currentUser.following
        if (currentUser) {
          let updatedFollowing = [...currentUser.following]
          if (nowFollowing) {
            if (!updatedFollowing.includes(celebrityId)) updatedFollowing.push(celebrityId)
          } else {
            updatedFollowing = updatedFollowing.filter(fId => fId !== celebrityId)
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
        return {
          ...prev,
          [celebrityId]: nowFollowing
        }
      })
      
      console.log(response.data.message)
    } catch (error) {
      console.error('Follow/Unfollow error:', error)
    } finally {
      setIsFollowingLoading(prev => ({ ...prev, [celebrityId]: false }))
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCelebrities(searchQuery)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-page__header">
          <h2>Search Celebrities</h2>
          <p>Discover and follow your favorite celebrities</p>
        </div>
        
        <div className="search-page__input">
          <IoSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for celebrities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="search-page__results">
          {isLoading ? (
            <div className="search-loading">
              <p>Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-grid">
              {searchResults.map((celebrity) => (
                <div key={celebrity._id} className="search-result-item">
                  <Link
                    to={`/users/${celebrity._id}`}
                    className="search-result-link"
                  >
                    <ProfileImage image={celebrity.profilePhoto} />
                    <div className="search-result-info">
                      <h4>{celebrity.fullName}</h4>
                      <p>{celebrity.bio}</p>
                      <span className="celebrity-badge">Celebrity</span>
                    </div>
                  </Link>
                  <button
                    className={`search-follow-btn ${followingStatus[celebrity._id] ? 'following' : ''}`}
                    onClick={() => handleFollowUnfollow(celebrity._id, celebrity.fullName)}
                    disabled={isFollowingLoading[celebrity._id]}
                  >
                    {isFollowingLoading[celebrity._id] ? (
                      <span className="loading-spinner"></span>
                    ) : followingStatus[celebrity._id] ? (
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
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="search-no-results">
              <p>No celebrities found for "{searchQuery}"</p>
              <p>Try searching with different keywords</p>
            </div>
          ) : (
            <div className="search-placeholder">
              <div className="search-placeholder-icon">
                <IoSearch />
              </div>
              <h3>Start searching for celebrities</h3>
              <p>Type in the search box above to discover celebrities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search 