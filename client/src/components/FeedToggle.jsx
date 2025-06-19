import React from 'react'

const FeedToggle = ({ activeFeed, onFeedChange }) => {
  return (
    <div className="forYouOrFollowing">
      <button 
        className={activeFeed === 'all' ? 'active' : ''} 
        onClick={() => onFeedChange('all')}
      >
        All Feed
      </button>
      <button 
        className={activeFeed === 'following' ? 'active' : ''} 
        onClick={() => onFeedChange('following')}
      >
        Following Feed
      </button>
    </div>
  )
}

export default FeedToggle 