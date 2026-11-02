
const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all notifications for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.userId
        })
            .populate("actor", "username profilePicture")
            .populate("post", "caption image")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            message: "Notifications fetched successfully",
            notifications
        });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});

// Get unread notification count
router.get("/unread-count", authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.userId,
            isRead: false
        });

        res.json({ unreadCount: count });
    } catch (error) {
        console.error("Unread count error:", error);
        res.status(500).json({
            message: "Failed to fetch unread count"
        });
    }
});

// Mark one notification as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.userId
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({
            message: "Failed to update notification"
        });
    }
});

// Mark all notifications as read
router.patch("/read-all", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.userId,
                isRead: false
            },
            { isRead: true }
        );

        res.json({
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all read error:", error);
        res.status(500).json({
            message: "Failed to update notifications"
        });
    }
});

module.exports = router;
