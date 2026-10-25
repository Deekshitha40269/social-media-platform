const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You have access to the protected route",
        userId: req.userId
    });
});

module.exports = router;