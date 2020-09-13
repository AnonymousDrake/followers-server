const Post = require("../models/Post");
const Relation = require("../models/Relation");

const postMiddleware = async (req, res, next) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    if (!relation) {
      throw new Error();
    }
    const following = await relation.followings.find(async (following) => {
      following._id.toString() === req.params.id.toString();
    });
    if (!following) {
      throw new Error({ error: "Follow user to view profile!" });
    }
    const userPosts = await Post.findOne({ creator: req.params.id });

    req.posts = userPosts.posts;
    const followingUser = await Relation.findOne({
      creator: following.followingId,
    });
    req.followings = followingUser.followings;
    req.followers = followingUser.followers;
    next();
  } catch (err) {
    res.status(401).send();
  }
};

module.exports = postMiddleware;
