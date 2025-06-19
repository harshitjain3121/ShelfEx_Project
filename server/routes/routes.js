const router=require("express").Router()

const {registerUser, loginUser, getUser, getUsers, editUser, followUnfollowUser, changeUserAvatar, searchUsers, getNotifications, markNotificationAsRead}=require('../controllers/userControllers')
const {createPost, getPost, getPosts, deletePost, getUserPosts, likeDislikePost, getFollowingPosts, updatePost}=require('../controllers/postControllers')
const authMiddleware = require("../middleware/authMiddleware")

//USER ROUTES
router.post('/users/register',registerUser)
router.post('/users/login',loginUser)
router.get('/users/search', authMiddleware, searchUsers);
router.get('/users/:id', authMiddleware, getUser)
router.get('/users' , authMiddleware, getUsers)
router.patch('/users/:id', authMiddleware, editUser)
router.get('/users/:id/follow-unfollow', authMiddleware, followUnfollowUser)
router.post('/users/avatar', authMiddleware, changeUserAvatar)
router.get('/users/:id/posts', authMiddleware, getUserPosts)
router.get('/users/notifications', authMiddleware, getNotifications);
router.delete('/users/notifications/:notificationId', authMiddleware, markNotificationAsRead);


//POST ROUTES
router.post('/posts', authMiddleware, createPost)
router.get('/posts/followings', authMiddleware, getFollowingPosts)
router.get('/posts/:id', authMiddleware, getPost)
router.get('/posts', authMiddleware, getPosts)
router.patch('/posts/:id', authMiddleware, updatePost)
router.delete('/posts/:id', authMiddleware, deletePost)
router.get('/posts/:id/like', authMiddleware, likeDislikePost)




module.exports=router;