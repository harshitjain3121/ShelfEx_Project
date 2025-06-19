import React from 'react'

const FeedSkeleton = () => {
  return (
    <div className="feedSkeleton">
      {[1, 2, 3].map((item) => (
        <div key={item} className="feedSkeleton__item">
          <div className="feedSkeleton__item-head">
            <div></div>
          </div>
          <div className="feedSkeleton__item-body"></div>
          <div className="feedSkeleton__item-footer">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeedSkeleton 