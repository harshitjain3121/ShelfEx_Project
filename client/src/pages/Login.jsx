import React,{ useState, useEffect } from 'react'
import { FaEye , FaEyeSlash } from "react-icons/fa"
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { userActions } from '../store/user-slice';

const Login = () => {
  const [userData, setUserData] = useState({email: "", password: ""})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [ showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === 'true') {
      setSuccess('Registration successful! Please login with your credentials.')
    }
  }, [searchParams])


  const changeInputHandler=(e)=>{
      setUserData(prevState => ({...prevState, [e.target.name]:e.target.value }))
  }



  const loginUser=async(e)=>{
    e.preventDefault();
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, userData);
        if(response.status == 200){
          dispatch(userActions.changeCurrentUser(response?.data))
          localStorage.setItem("currentUser", JSON.stringify(response?.data))
          navigate('/')
        }
    } catch (err) {
        setError(err.response?.data?.message)
    }
  }

  const loadDemoCredentials = (type) => {
    if (type === 'public') {
      setUserData({ email: "public@demo.com", password: "123456" })
    } else if (type === 'celebrity') {
      setUserData({ email: "celebrity@demo.com", password: "123456" })
    }
  }



  return (
    <section className="register">
      <div className="container register__container">
        <h2>Sign In</h2>
        <form onSubmit={loginUser}>
          {error && <p className="form__error-message">{error}</p> }
          {success && <p className="form__success-message">{success}</p> }
          <input type="text" name="email" placeholder="Email" onChange={changeInputHandler} value={userData.email}/>
          <div className="password__controller">
            <input type={showPassword? "text": "password"} name="password" placeholder="Password" onChange={changeInputHandler} value={userData.password}/>
            <span onClick={()=> setShowPassword(!showPassword)}>{showPassword ? < FaEyeSlash />: < FaEye />}</span>
          </div>
          
          {/* Demo Login Buttons */}
          <div className="demo__login">
            <h4>Quick Demo Login:</h4>
            <div className="demo__buttons">
              <button 
                type="button" 
                className="btn sm" 
                onClick={() => loadDemoCredentials('public')}
              >
                Load Public User
              </button>
              <button 
                type="button" 
                className="btn sm" 
                onClick={() => loadDemoCredentials('celebrity')}
              >
                Load Celebrity User
              </button>
            </div>
          </div>
          
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          <button type="submit" className='btn primary'>Login</button>
        </form>
      </div>
    </section>
  )
}

export default Login