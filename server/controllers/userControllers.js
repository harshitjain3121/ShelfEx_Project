const HttpError=require('../models/errorModel')
const UserModel=require('../models/userModel')


const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const uuid=require("uuid").v4;
const fs=require("fs")
const path=require("path")
const cloudinary=require("../utils/cloudinary")



// {fullName, email, password, profilePhoto, bio, followers, following, bookmarks, posts}
// =====================================REGISTER USER
// POST : api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
    try {
        const { fullName, email, password, confirmPassword, role } = req.body;

        if (!fullName || !email || !password || !confirmPassword) {
            return next(new HttpError("Fill in all fields", 422));
        }

        const lowerCaseEmail = email.toLowerCase();
        const emailExists = await UserModel.findOne({ email: lowerCaseEmail });

        if (emailExists) {
            return next(new HttpError("Email already exists", 422));
        }

        if (password !== confirmPassword) {
            return next(new HttpError("Passwords do not match", 422));
        }

        if (password.length < 6) {
            return next(new HttpError("Password should be at least 6 characters", 422));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await UserModel.create({
            fullName,
            email: lowerCaseEmail,
            password: hashedPassword,
            role: role === "Celebrity" ? "Celebrity" : "Public" // default to Public
        });

        res.status(201).json(newUser);

    } catch (error) {
        return next(new HttpError(error.message || "Registration failed", 500));
    }
};





// =====================================LOGIN USER
// POST : api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new HttpError("Fill in all fields", 422));
        }

        const lowerCaseEmail = email.toLowerCase();
        const user = await UserModel.findOne({ email: lowerCaseEmail });

        if (!user) {
            return next(new HttpError("Invalid Credential", 422));
        }

        const comparePass = await bcrypt.compare(password, user?.password);
        if (!comparePass) {
            return next(new HttpError("Invalid Credential", 422));
        }
        const unreadCount = user.notifications.filter(n => !n.isRead).length;

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePhoto: user.profilePhoto,
                bio: user.bio,
                role: user.role,
                followers: user.followers,
                following: user.following,
                posts: user.posts,
                unreadNotifications: unreadCount
            }
        });

    } catch (error) {
        return next(new HttpError(error.message || "Login failed", 500));
    }
};





// =====================================GET USER
// GET : api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await UserModel.findById(id)
            .select("-password") // Exclude password
            .populate("followers", "fullName profilePhoto")
            .populate("following", "fullName profilePhoto")
            .populate("posts");

        if (!user) {
            return next(new HttpError("User not found", 404));
        }

        // Optional: Check if logged-in user follows this user
        const isFollowing = req.user
            ? user.followers.some(follower => follower._id.toString() === req.user.id)
            : false;

        // Calculate counts
        const followersCount = user.followers.length;
        const followingCount = user.following.length;
        const postsCount = user.posts.length;

        res.status(200).json({
            ...user.toObject(),
            isFollowing,
            followersCount,
            followingCount,
            postsCount
        });

    } catch (error) {
        return next(new HttpError(error.message || "Something went wrong", 500));
    }
};






// =====================================GET USERS
// GET : api/users
// PROTECTED
const getUsers = async (req, res, next) => {
    try {
        const users = await UserModel.find()
            .select("-password")
            .limit(10)
            .sort({ createdAt: -1 }); // Fix typo: createAt -> createdAt

        res.status(200).json(users);
    } catch (error) {
        return next(new HttpError(error.message || "Something went wrong", 500));
    }
};






// =====================================EDIT USER
// PATCH : api/users/:id
// PROTECTED
const editUser = async (req, res, next) => {
    try {
        const { fullName, bio } = req.body;
        let profilePhotoUrl = null;

        // Handle profile photo upload if provided
        if (req.files && req.files.profilePhoto) {
            const { profilePhoto } = req.files;

            if (profilePhoto.size > 500000) {
                return next(new HttpError("Profile picture too big. Should be less than 500kb", 422));
            }

            // Rename the file with UUID
            const fileExt = path.extname(profilePhoto.name);
            const fileName = `${uuid()}${fileExt}`;
            const filePath = path.join(__dirname, "..", "uploads", fileName);

            // Save file locally
            await profilePhoto.mv(filePath);

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: "image",
                folder: "avatars",
            });

            if (!result.secure_url) {
                return next(new HttpError("Couldn't upload image to Cloudinary", 422));
            }

            profilePhotoUrl = result.secure_url;

            // Clean up local file
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete local avatar:", err.message);
            });
        }

        if (!fullName && !bio && !profilePhotoUrl) {
            return next(new HttpError("Provide at least one field to update", 422));
        }

        const updatedFields = {};
        if (fullName) updatedFields.fullName = fullName;
        if (bio !== undefined) updatedFields.bio = bio;
        if (profilePhotoUrl) updatedFields.profilePhoto = profilePhotoUrl;

        const editedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            updatedFields,
            { new: true }
        ).select("-password");

        res.status(200).json(editedUser);
    } catch (error) {
        return next(new HttpError(error.message || "Could not update user", 500));
    }
};





// =====================================FOLLOW/UNFOLLOW USER
// GET : api/users/:id/follow-unfollow
// PROTECTED
const followUnfollowUser = async (req, res, next) => {
    try {
        const userToFollowId = req.params.id;

        if (req.user.id === userToFollowId) {
            return next(new HttpError("You can't follow/unfollow yourself", 422));
        }

        const currentUser = await UserModel.findById(req.user.id);
        const targetUser = await UserModel.findById(userToFollowId);

        if (!currentUser || !targetUser) {
            return next(new HttpError("User not found", 404));
        }

        // ✅ Only allow following Celebrities
        if (targetUser.role !== "Celebrity") {
            return next(new HttpError("You can only follow Celebrity users", 403));
        }

        const isFollowing = currentUser.following.includes(userToFollowId);

        if (!isFollowing) {
            // Follow
            await UserModel.findByIdAndUpdate(userToFollowId, {
                $push: { followers: req.user.id }
            });

            await UserModel.findByIdAndUpdate(req.user.id, {
                $push: { following: userToFollowId }
            });

            // Optional: Add notification to Celebrity
            await UserModel.findByIdAndUpdate(userToFollowId, {
                $push: {
                    notifications: {
                        type: "follow",
                        message: `${currentUser.fullName} started following you.`,
                        isRead: false
                    }
                }
            });

            return res.status(200).json({ message: "Followed successfully" });
        } else {
            // Unfollow
            await UserModel.findByIdAndUpdate(userToFollowId, {
                $pull: { followers: req.user.id }
            });

            await UserModel.findByIdAndUpdate(req.user.id, {
                $pull: { following: userToFollowId }
            });

            return res.status(200).json({ message: "Unfollowed successfully" });
        }

    } catch (error) {
        return next(new HttpError(error.message || "Failed to follow/unfollow user", 500));
    }
};


// =====================================CHANGE USER PROFILE USER
// POST : api/users/avatar
// PROTECTED
const changeUserAvatar = async (req, res, next) => {
    try {
        if (!req.files || !req.files.avatar) {
            return next(new HttpError("Please choose an image", 422));
        }

        const { avatar } = req.files;

        if (avatar.size > 500000) {
            return next(new HttpError("Profile picture too big. Should be less than 500kb", 422));
        }

        // Rename the file with UUID
        const fileExt = path.extname(avatar.name);
        const fileName = `${uuid()}${fileExt}`;
        const filePath = path.join(__dirname, "..", "uploads", fileName);

        // Save file locally
        await avatar.mv(filePath);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "image",
            folder: "avatars", // optional folder
        });

        if (!result.secure_url) {
            return next(new HttpError("Couldn't upload image to Cloudinary", 422));
        }

        // Update user's profile photo
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            { profilePhoto: result.secure_url },
            { new: true }
        );

        // Clean up local file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete local avatar:", err.message);
        });

        res.status(200).json(updatedUser);

    } catch (error) {
        return next(new HttpError(error.message || "Failed to change avatar", 500));
    }
};




// =====================================SEARCH USER
// GET  : api/users/search?query=xyz
// PROTECTED
const searchUsers = async (req, res, next) => {
    const query = req.query.query;
    try {
        const users = await UserModel.find({
            fullName: { $regex: query, $options: "i" },
        }).select("fullName profilePhoto role");
        res.status(200).json(users);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to search users", 500));
    }
};




// =====================================SEARCH USER
// GET  : api/users/notifications
// PROTECTED
const getNotifications = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user.id).select("notifications");

        if (!user) {
            return next(new HttpError("User not found", 404));
        }

        res.status(200).json(user.notifications.reverse()); // latest first
    } catch (error) {
        return next(new HttpError(error.message || "Failed to get notifications", 500));
    }
};




// =====================================SEARCH USER
// DELETE  : api/users/notifications
// PROTECTED
const markNotificationAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        await UserModel.findByIdAndUpdate(
            req.user.id,
            { $pull: { notifications: { _id: notificationId } } }, // or add `read: true` if tracking read status
            { new: true }
        );

        res.status(200).json({ message: "Notification removed" });
    } catch (error) {
        return next(new HttpError(error.message || "Failed to mark notification as read", 500));
    }
};













module.exports={registerUser, loginUser, getUser, getUsers, editUser, followUnfollowUser, changeUserAvatar, searchUsers, getNotifications, markNotificationAsRead}