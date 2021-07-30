const Post = require("../models/Post");
const Relation = require("../models/Relation");

const postMiddleware = async (req, res, next) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });

    if (!relation) {
      throw new Error();
    }

    const following = relation.followings.find(
      (following) =>
        following.followingId.toString() === req.params.id.toString()
    );

    if (following === undefined) {
      throw new Error();
    }
    const userPosts = await Post.find({ creator: req.params.id });
    if (!userPosts) {
      return res.status(200).send([]);
    }
    req.posts = userPosts;
    let followingUser = await Relation.findOne({
      creator: following.followingId,
    });

    if (!followingUser) {
      followingUser = new Relation({ creator: following.followingId });
      await followingUser.save();
    }

    req.followings = followingUser.followings;
    req.followers = followingUser.followers;
    next();
  } catch (err) {
    res.status(401).send({ Error: "user not followed" });
  }
};

module.exports = postMiddleware;
