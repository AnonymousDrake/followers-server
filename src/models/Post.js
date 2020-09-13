const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User",
    },
    avatar: {
      type: Buffer,
    },
    posts: [
      {
        post: {
          type: Buffer,
        },
      },
    ],
  },
  {
    timeStamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;