import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './RootLayout'
import ErrorPage from './pages/ErrorPage'
import Home from './pages/Home'
import Search from './pages/Search'
import CreatePost from './pages/CreatePost'
import Profile from './pages/Profile'
import SinglePost from './pages/SinglePost'
import Login from './pages/Login'
import Register from './pages/Register'
import Logout from './pages/Logout'
import { Provider } from 'react-redux'
import store from './store/store'


const router = createBrowserRouter([
  {path: '/',element: <RootLayout />,errorElement: <ErrorPage />, children: [
    {index:true, element: <Home />},
    {path: "search", element: <Search />},
    {path: "create-post", element: <CreatePost />},
    {path: "users/:id", element: <Profile />},
    {path: "post/:id", element: <SinglePost />},
  ]},
  {path: "/login", element: <Login />},
  {path: "/register", element: <Register />},
  {path: "/logout", element: <Logout />},
])


const App = () => {
  return (
    <Provider store={store}><RouterProvider router={router} /></Provider>
  )
}

export default App