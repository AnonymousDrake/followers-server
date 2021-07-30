const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  data: {
    type: Buffer,
    required: true,
  },
  postedAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    type: [String],
    default: [],
  },
  captions: {
    type: String,
    maxlength: 300,
  },
  uri: {
    type: String,
    required: true,
  },
});

postSchema.method.toJSON = function () {
  const post = this;
  const postObject = post.toObject();
  delete postObject.data;
  return postObject;
};

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
