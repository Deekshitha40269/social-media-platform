const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        // User who created the post
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Text/content of the post
        caption: {
            type: String,
            default: "",
            trim: true
        },

        // Image URL of the post
        image: {
            type: String,
            default: ""
        },

        // Users who liked the post
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Post", postSchema);