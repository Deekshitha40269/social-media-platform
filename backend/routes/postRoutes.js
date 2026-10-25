const express = require("express");

const {
    createPost,
    getAllPosts,
    getMyPosts,
    getHomeFeed,
    deletePost,
    likePost,
    unlikePost
} = require("../controllers/postController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a post
router.post("/", authMiddleware, createPost);

// Get all posts
router.get("/", authMiddleware, getAllPosts);

// Get my posts
router.get("/me", authMiddleware, getMyPosts);

// Get home feed
router.get("/feed", authMiddleware, getHomeFeed);

// Delete a post
router.delete("/:id", authMiddleware, deletePost);

// Like a post
router.post("/:id/like", authMiddleware, likePost);

// Unlike a post
router.delete("/:id/like", authMiddleware, unlikePost);

module.exports = router;
