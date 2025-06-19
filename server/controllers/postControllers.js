const HttpError=require('../models/errorModel')
const PostModel=require('../models/postModel')
const UserModel=require('../models/userModel')

const {v4: uuid}=require("uuid")
const cloudinary=require('../utils/cloudinary')
const fs=require('fs')
const path=require('path')
const { io } = require('../socket/socket')




// =================CREATE POST
// POST : api/posts
// PROTECTED
const createPost = async (req, res, next) => {
    try {
        const { body } = req.body;

        if (!body || body.trim() === "") {
            return next(new HttpError("Post text cannot be empty", 422));
        }

        // Fetch the user and check role
        const creator = await UserModel.findById(req.user.id).select("fullName role followers");
        if (!creator) {
            return next(new HttpError("User not found", 404));
        }

        if (creator.role !== "Celebrity") {
            return next(new HttpError("Only celebrities can create posts", 403));
        }

        let imageUrl = "";

        // Optional image upload
        if (req.files && req.files.image) {
            const { image } = req.files;

            if (image.size > 500000) {
                return next(new HttpError("Image is too big. Should be less than 500KB", 422));
            }

            const ext = path.extname(image.name);
            const filename = `${uuid()}${ext}`;
            const uploadPath = path.join(__dirname, "..", "uploads", filename);

            await image.mv(uploadPath);

            const result = await cloudinary.uploader.upload(uploadPath, {
                resource_type: "image",
                folder: "posts",
            });

            fs.unlink(uploadPath, (err) => {
                if (err) console.error("Failed to delete local post image:", err.message);
            });

            if (!result.secure_url) {
                return next(new HttpError("Failed to upload image to Cloudinary", 422));
            }

            imageUrl = result.secure_url;
        }

        // Create the post
        const newPost = await PostModel.create({
            creator: req.user.id,
            body,
            image: imageUrl || undefined
        });

        // Add post to user's post array
        await UserModel.findByIdAndUpdate(req.user.id, {
            $push: { posts: newPost._id }
        });

        // Send notification to followers
        if (creator.followers.length > 0) {
            const notification = {
                type: "new_post",
                message: `${creator.fullName} posted a new post.`,
                post: newPost._id,
                celebrityId: creator._id,
                isRead: false,
                createdAt: new Date()
            };

            await UserModel.updateMany(
                { _id: { $in: creator.followers } },
                {
                    $push: {
                        notifications: {
                            $each: [notification],
                            $slice: -50 // Keep last 50 notifications
                        }
                    }
                }
            );

            // For each follower, emit notification and badge count
            for (const follower of creator.followers) {
                // Get unread count for this follower
                const followerUser = await UserModel.findById(follower).select('notifications');
                const unreadCount = followerUser.notifications.filter(n => !n.isRead).length;
                io.to(follower.toString()).emit('notification', {
                    notification: {
                        ...notification,
                        post: newPost // Optionally populate post data
                    },
                    unreadCount
                });
            }
        }
        res.status(201).json(newPost);

    } catch (error) {
        return next(new HttpError(error.message || "Failed to create post", 500));
    }
};






// =================GET POST
// GET : api/posts/:id
// PROTECTED
const mongoose = require("mongoose");

const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await PostModel.findById(id)
            .populate("creator", "-password"); // Exclude sensitive fields

        if (!post) {
            return next(new HttpError("Post not found", 404));
        }

        res.status(200).json(post);

    } catch (error) {
        return next(new HttpError(error.message || "Failed to fetch post", 500));
    }
};






// =================GET POSTS
// GET : api/posts
// PROTECTED
const getPosts=async(req,res,next)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const total = await PostModel.countDocuments();
        const posts = await PostModel.find().sort({createdAt: -1}).skip(skip).limit(limit);
        const hasMore = skip + posts.length < total;
        // Artificial delay of 5 seconds
        setTimeout(() => {
          res.json({ posts, hasMore });
        }, 2000);
    }catch(error){
        return next(new HttpError(error))
    }
}




// =================UPDATE POST
// PATCH : api/posts/:id
// PROTECTED
const updatePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const { body } = req.body;

        if (!body || body.trim() === "") {
            return next(new HttpError("Post body cannot be empty", 400));
        }

        const post = await PostModel.findById(postId);

        if (!post) {
            return next(new HttpError("Post not found", 404));
        }

        if (post.creator.toString() !== req.user.id) {
            return next(new HttpError("You are not authorized to update this post", 403));
        }

        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            { body },
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to update post", 500));
    }
};





// =================DELETE POST
// DELETE : api/posts/:id
// PROTECTED
const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id;

        const post = await PostModel.findById(postId);
        if (!post) {
            return next(new HttpError("Post not found", 404));
        }

        if (post.creator.toString() !== req.user.id) {
            return next(new HttpError("You are not authorized to delete this post", 403));
        }

        await PostModel.findByIdAndDelete(postId);

        await UserModel.findByIdAndUpdate(post.creator, {
            $pull: { posts: postId }
        });

        res.status(200).json({ message: "Post deleted successfully", postId });
    } catch (error) {
        return next(new HttpError(error.message || "Failed to delete post", 500));
    }
};





// =================GET FOLLOWINGS POSTS
// GET : api/posts/followings
// PROTECTED
const getFollowingPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return next(new HttpError("User not found", 404));
        }

        const total = await PostModel.countDocuments({ creator: { $in: user.following } });
        const posts = await PostModel.find({ creator: { $in: user.following } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const hasMore = skip + posts.length < total;
        // Artificial delay of 5 seconds
        setTimeout(() => {
          res.status(200).json({ posts, hasMore });
        }, 2000);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to fetch following posts", 500));
    }
};





// =================LIKE/DISLIKE POST
//GET : api/posts/:id/like
// PROTECTED
const likeDislikePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await PostModel.findById(id);
        if (!post) {
            return next(new HttpError("Post not found", 404));
        }

        let updatePost;

        if (post.likes.includes(req.user.id)) {
            // User already liked -> remove like
            updatePost = await PostModel.findByIdAndUpdate(
                id,
                { $pull: { likes: req.user.id } },
                { new: true }
            );
        } else {
            // User not liked yet -> add like
            updatePost = await PostModel.findByIdAndUpdate(
                id,
                { $addToSet: { likes: req.user.id } },
                { new: true }
            );
        }

        res.status(200).json(updatePost);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to toggle like", 500));
    }
};





// =================GET USER POSTS
// GET : api/users/:id/posts
// PROTECTED
const getUserPosts = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await UserModel.findById(userId).populate({
            path: "posts",
            options: { sort: { createdAt: -1 } }
        });

        if (!user) {
            return next(new HttpError("User not found", 404));
        }

        res.status(200).json(user.posts);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to fetch user posts", 500));
    }
};













module.exports={createPost, deletePost, getPost, getPosts, getUserPosts, likeDislikePost, getFollowingPosts, updatePost}