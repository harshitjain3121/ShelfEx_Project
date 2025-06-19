import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProfileImage from './ProfileImage'
import { useSelector } from 'react-redux';


const Navbar = () => {
  const userId = useSelector(state => state?.user?.currentUser?.user?.id);
  const token= useSelector(state => state?.user?.currentUser?.token);
  const profilePhoto= useSelector(state => state?.user?.currentUser?.user?.profilePhoto);
  const user = useSelector(state => state?.user?.currentUser?.user);


  
  const navigate=useNavigate()

  useEffect(() => {
    if(!token){
      navigate("/login")
    }
  }, [])



  useEffect(() => {
    setTimeout(()=>{
      navigate("/logout")
    },1000*60*60);
  }, [])
  

  // // Debug: Check what profile photo data we're getting
  // console.log('Profile Photo from Redux:', profilePhoto);
  // console.log('Profile Photo type:', typeof profilePhoto);
  // console.log('Profile Photo length:', profilePhoto?.length);
  // console.log('Full currentUser object:', useSelector(state => state?.user?.currentUser));

  return (
    <nav className="navbar">
      <div className="container navbar__container">
        <Link to="/" className='navbar__logo'>ShelfEx</Link>
        <div className="navbar__right">
          <Link to={`/users/${userId}`} className="navbar__profile" style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
            {user && <span className="navbar__user-name" style={{fontWeight: 600, color: 'var(--color-gray-900)'}}>{user.fullName}</span>}
            <ProfileImage image={profilePhoto} />
          </Link>
          {token? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
        </div>
      </div>
    </nav>
  )
}

export default Navbar