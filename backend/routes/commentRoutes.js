const express = require("express");

const {
    createComment,
    getComments,
    updateComment,
    deleteComment
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a comment
router.post("/", authMiddleware, createComment);

// Get comments for a post
router.get("/:postId", authMiddleware, getComments);

// Update a comment
router.put("/:id", authMiddleware, updateComment);

// Delete a comment
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;