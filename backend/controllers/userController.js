
const User = require("../models/User");
const Notification = require("../models/Notification");

// ==========================================
// GET MY PROFILE
// ==========================================
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile fetched successfully",
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// UPDATE MY PROFILE
// ==========================================
const updateMyProfile = async (req, res) => {
    try {
        const { username, bio, profilePicture } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (username !== undefined) {
            user.username = username;
        }

        if (bio !== undefined) {
            user.bio = bio;
        }

        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// FOLLOW USER + NOTIFICATION
// ==========================================
const followUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        // Prevent following yourself
        if (req.userId.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const currentUser = await User.findById(req.userId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Prevent duplicate follows
        if (
            currentUser.following.some(
                id => id.toString() === targetUserId.toString()
            )
        ) {
            return res.status(400).json({
                message: "Already following this user"
            });
        }

        // Update following and followers
        currentUser.following.push(targetUser._id);
        targetUser.followers.push(currentUser._id);

        await currentUser.save();
        await targetUser.save();

        // Create notification for followed user
        try {
            await Notification.create({
                recipient: targetUser._id,
                actor: currentUser._id,
                type: "follow",
                message: "started following you"
            });
        } catch (notificationError) {
            console.error(
                "Follow notification error:",
                notificationError
            );
        }

        res.json({
            message: "User followed successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// UNFOLLOW USER
// ==========================================
const unfollowUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        const currentUser = await User.findById(req.userId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        currentUser.following =
            currentUser.following.filter(
                id => id.toString() !== targetUserId.toString()
            );

        targetUser.followers =
            targetUser.followers.filter(
                id => id.toString() !== req.userId.toString()
            );

        await currentUser.save();
        await targetUser.save();

        res.json({
            message: "User unfollowed successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// SEARCH USERS
// ==========================================
const searchUsers = async (req, res) => {
    try {
        const query = req.query.username?.trim();

        if (!query) {
            return res.status(400).json({
                message: "Please provide a username to search"
            });
        }

        // Case-insensitive partial username search
        const escapedQuery = query.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const users = await User.find({
            username: {
                $regex: escapedQuery,
                $options: "i"
            }
        })
            .select("username profilePicture bio followers following")
            .limit(20);

        res.json({
            message: "Users found successfully",
            users
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    getMyProfile,
    updateMyProfile,
    followUser,
    unfollowUser,
    searchUsers
};
