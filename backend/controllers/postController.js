
const Post = require("../models/Post");
const User = require("../models/User");

// ==========================================
// CREATE POST
// ==========================================
const createPost = async (req, res) => {
    try {
        const { caption, image } = req.body;

        const post = await Post.create({
            user: req.userId,
            caption: caption || "",
            image: image || ""
        });

        res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// GET ALL POSTS
// ==========================================
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "username profilePicture")
            .populate("likes", "username profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            message: "Posts fetched successfully",
            posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// GET MY POSTS
// ==========================================
const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            user: req.userId
        })
            .populate("user", "username profilePicture")
            .populate("likes", "username profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            message: "My posts fetched successfully",
            posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// GET HOME FEED
// ==========================================
const getHomeFeed = async (req, res) => {
    try {
        // Find the logged-in user
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Include the logged-in user and people they follow
        const feedUserIds = [
            user._id,
            ...user.following
        ];

        // Fetch posts from those users, newest first
        const posts = await Post.find({
            user: { $in: feedUserIds }
        })
            .populate("user", "username profilePicture")
            .populate("likes", "username profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            message: "Home feed fetched successfully",
            posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// DELETE POST
// ==========================================
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Only the post owner can delete
        if (post.user.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only delete your own posts"
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// LIKE POST
// ==========================================
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Prevent duplicate likes
        if (post.likes.some(id => id.toString() === req.userId)) {
            return res.status(400).json({
                message: "Post already liked"
            });
        }

        post.likes.push(req.userId);
        await post.save();

        res.json({
            message: "Post liked successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// UNLIKE POST
// ==========================================
const unlikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        post.likes = post.likes.filter(
            id => id.toString() !== req.userId
        );

        await post.save();

        res.json({
            message: "Post unliked successfully"
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
    createPost,
    getAllPosts,
    getMyPosts,
    getHomeFeed,
    deletePost,
    likePost,
    unlikePost
};
