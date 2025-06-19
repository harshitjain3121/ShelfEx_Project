import React,{ useState } from 'react'
import { FaEye , FaEyeSlash } from "react-icons/fa";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'

const Register = () => {
  const [userData, setUserData] = useState({fullName: "", email: "", password: "", confirmPassword: "", role: "Public"})
  const [error, setError] = useState("")
  const [ showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()



  const changeInputHandler=(e)=>{
      setUserData(prevState => ({...prevState, [e.target.name]:e.target.value }))
  }



  const registerUser=async(e)=>{
    e.preventDefault();
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/register`, userData);
        if(response.status === 201){
          navigate('/login?success=true')
        }
    } catch (err) {
        setError(err.response?.data?.message)
    }
  }



  return (
    <section className="register">
      <div className="container register__container">
        <h2>Sign Up</h2>
        <form onSubmit={registerUser}>
          {error && <p className="form__error-message">{error}</p> }
          {/* Role Selection */}
          <div className="role__selection">
            <h4>Select Your Role:</h4>
            <div className="role__options">
              <label className="role__option">
                <input 
                  type="radio" 
                  name="role" 
                  value="Public" 
                  checked={userData.role === "Public"}
                  onChange={changeInputHandler}
                />
                <span className="role__label">
                  <strong>Public User</strong>
                  <small>Browse and follow celebrities, view their posts</small>
                </span>
              </label>
              <label className="role__option">
                <input 
                  type="radio" 
                  name="role" 
                  value="Celebrity" 
                  checked={userData.role === "Celebrity"}
                  onChange={changeInputHandler}
                />
                <span className="role__label">
                  <strong>Celebrity</strong>
                  <small>Create posts, share content with your followers</small>
                </span>
              </label>
            </div>
          </div>


          
          <input type="text" name='fullName' placeholder='Full Name' onChange={changeInputHandler} autoFocus />
          <input type="text" name="email" placeholder="Email" onChange={changeInputHandler}/>
          

          <div className="password__controller">
            <input type={showPassword? "text": "password"} name="password" placeholder="Password" onChange={changeInputHandler}/>
            <span onClick={()=> setShowPassword(!showPassword)}>{showPassword ? < FaEyeSlash />: < FaEye />}</span>
          </div>
          <div className="password__controller">
            <input type={showPassword? "text": "password"} name="confirmPassword" placeholder="Confirm Password" onChange={changeInputHandler}/>
            <span onClick={()=> setShowPassword(!showPassword)}>{showPassword ? < FaEyeSlash />: < FaEye />}</span>
          </div>
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
          <button type="submit" className='btn primary'>Register</button>
        </form>
      </div>
    </section>
  )
}

export default Register