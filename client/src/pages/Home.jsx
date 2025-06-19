import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from "react-redux"
import FeedToggle from "../components/FeedToggle"
import FeedSkeleton from "../components/FeedSkeleton"
import axios from 'axios'
import Feeds from '../components/Feeds'

// Add a simple spinner component
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
    <div className="loading-spinner" style={{ width: '2.5rem', height: '2.5rem', border: '4px solid #eee', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
  </div>
)

const Home = () => {

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading]= useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeFeed, setActiveFeed] = useState('all') // 'all' or 'following'
  const token = useSelector(state => state?.user?.currentUser?.token)
  const limit = 5

  const getPosts = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsLoadingMore(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts?page=${pageNum}&limit=${limit}`, {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      if (append) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = response.data.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(response.data.posts)
      }
      setHasMore(response.data.hasMore)
    } catch (err) {
      console.log(err)
    } finally {
      if (pageNum === 1) setIsLoading(false)
      else setIsLoadingMore(false)
    }
  }

  const getFollowingPosts = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsLoadingMore(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/followings?page=${pageNum}&limit=${limit}`, {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      if (append) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = response.data.posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(response.data.posts)
      }
      setHasMore(response.data.hasMore)
    } catch (err) {
      console.log(err)
    } finally {
      if (pageNum === 1) setIsLoading(false)
      else setIsLoadingMore(false)
    }
  }

  const handleFeedChange = (feedType) => {
    setActiveFeed(feedType)
    setPage(1)
    setHasMore(true)
    if (feedType === 'all') {
      getPosts(1, false)
    } else {
      getFollowingPosts(1, false)
    }
  }

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    getPosts(1, false)
    // eslint-disable-next-line
  }, [])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) return
    if (window.innerHeight + document.documentElement.scrollTop + 200 >= document.documentElement.offsetHeight) {
      const nextPage = page + 1
      setPage(nextPage)
      if (activeFeed === 'all') {
        getPosts(nextPage, true)
      } else {
        getFollowingPosts(nextPage, true)
      }
    }
  }, [isLoadingMore, isLoading, hasMore, page, activeFeed])

  useEffect(() => {
    if (!isLoadingMore) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      // Remove scroll event while loading more
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, isLoadingMore])

  console.log(posts)

  return (
    <section className="mainArea">
      <FeedToggle activeFeed={activeFeed} onFeedChange={handleFeedChange} />
      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <>
          <Feeds posts={posts} onSetPosts={setPosts} feedType={activeFeed} />
          {isLoadingMore && <Spinner />}
          {!hasMore && posts.length > 0 && <p style={{textAlign:'center',color:'#888'}}>No more posts</p>}
        </>
      )}
    </section>
  )
}

export default Home