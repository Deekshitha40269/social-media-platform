
const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    followUser,
    unfollowUser,
    searchUsers
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Search users by username
router.get("/search", authMiddleware, searchUsers);

// Get logged-in user's profile
router.get("/me", authMiddleware, getMyProfile);

// Update logged-in user's profile
router.put("/me", authMiddleware, updateMyProfile);

// Follow a user
router.post("/:id/follow", authMiddleware, followUser);

// Unfollow a user
router.delete("/:id/follow", authMiddleware, unfollowUser);

module.exports = router;
