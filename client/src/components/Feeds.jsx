import React from 'react'
import Feed from './Feed'

const Feeds = ({ posts, onSetPosts, feedType = 'all' }) => {
  const getEmptyMessage = () => {
    if (feedType === 'following') {
      return "No posts from people you follow. Start following some celebrities to see their posts here!";
    }
    return "No posts found.";
  }

  return (
    <div className='feeds'>
        {posts?.length < 1 ? (
          <p className='center'>{getEmptyMessage()}</p>
        ) : (
          posts?.map(post => <Feed key={post?._id} post={post} onSetPosts={onSetPosts} />)
        )}
    </div>
  )
}

export default Feeds