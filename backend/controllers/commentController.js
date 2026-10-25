const Comment = require("../models/Comment");
const Post = require("../models/Post");

// ==========================================
// CREATE COMMENT
// ==========================================
const createComment = async (req, res) => {
    try {
        const { post, text } = req.body;

        // Check required fields
        if (!post || !text) {
            return res.status(400).json({
                message: "Post and comment text are required"
            });
        }

        // Check if post exists
        const existingPost = await Post.findById(post);

        if (!existingPost) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Create comment
        const comment = await Comment.create({
            user: req.userId,
            post: post,
            text: text
        });

        // Get username and profile picture
        await comment.populate(
            "user",
            "username profilePicture"
        );

        res.status(201).json({
            message: "Comment created successfully",
            comment
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET COMMENTS FOR A POST
// ==========================================
const getComments = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Check if post exists
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Get comments
        const comments = await Comment.find({
            post: postId
        })
            .populate("user", "username profilePicture")
            .sort({ createdAt: 1 });

        res.json({
            message: "Comments fetched successfully",
            comments
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// UPDATE COMMENT
// ==========================================
const updateComment = async (req, res) => {
    try {
        const { text } = req.body;

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        // Only comment owner can update
        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only update your own comment"
            });
        }

        if (!text) {
            return res.status(400).json({
                message: "Comment text is required"
            });
        }

        comment.text = text;

        await comment.save();

        await comment.populate(
            "user",
            "username profilePicture"
        );

        res.json({
            message: "Comment updated successfully",
            comment
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// DELETE COMMENT
// ==========================================
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        // Only comment owner can delete
        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only delete your own comment"
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createComment,
    getComments,
    updateComment,
    deleteComment
};