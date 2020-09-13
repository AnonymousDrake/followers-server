const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middlewares/auth");
const postMiddleware = require("../middlewares/post");
const Post = require("../models/Post");
const User = require("../models/User");

const router = new express.Router();

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image file only"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const post = await Post.findOne({ creator: req.user._id });
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 180, height: 180 })
        .png()
        .toBuffer();
      post.avatar = buffer;
      await post.save();
      res.status(200).send();
    } catch (err) {
      res.status(500).send();
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ creator: req.user._id });
    post.avatar = undefined;
    await post.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.post(
  "/users/me/posts",
  auth,
  upload.single("post"),
  async (req, res) => {
    try {
      const post = await Post.findOne({ creator: req.user._id });
      const buffer = await sharp(req.file.buffer)
        .resize({ height: 250, width: 250 })
        .png().to;
      post.posts = post.posts.concat({ post: buffer });
      await post.save();
      res.send(200).send();
    } catch (err) {
      res.status(500).send();
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error });
  }
);

router.get("/users/me/posts", auth, async (req, res) => {
  try {
    const userPosts = await Post.findOne({ creator: req.user._id });
    if (!userPosts) {
      return res.status(200).send([]);
    }
    res.status(200).send(userPosts.posts);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/posts/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ creator: req.user._id });
    if (!post) {
      return res.status(404).send();
    }
    const _id = req.params.postId;
    const data = post.posts.find(
      (post) => post._id.toString() === _id.toString()
    );
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/avatar", auth, async (req, res) => {
  try {
    const userPosts = await Post.findOne({ creator: req.user._id });
    if (!userPosts || !userPosts.avatar) {
      return res.status(200).send([]);
    }
    res.set("Content-Type", "image/png").status(200).send(userPosts.avatar);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/:id/posts", auth, postMiddleware, async (req, res) => {
  res.status(200).send(req.posts);
});

router.get(
  "/users/:id/posts/:postId",
  auth,
  postMiddleware,
  async (req, res) => {
    const postId = req.params.postId;
    const post = req.posts.find(
      (post) => post._id.toString() === postId.toString()
    );
    res.status(200).send(post);
  }
);

router.delete("/users/me/posts/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ creator: req.user._id });
    if (!post) {
      return res.status(404).send();
    }
    const _id = req.params.postId;
    const index = post.posts.findIndex(
      (post) => post._id.toString() === _id.toString()
    );
    post.posts[index].remove();
    await post.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/:id/avatar", auth, async (req, res) => {
  const creator = req.params.id;
  const user = await User.findOne({ _id: creator });
  if (!user) {
    return res.status(404).send({ error: "No user found!" });
  }
  const userPosts = await Post.findOne({ creator });
  if (!userPosts || !userPosts.avatar) {
    return res.status(200).send({ message: "No avatar!" });
  }
  return res
    .set("Content-Type", "image/jpg")
    .status(200)
    .send(userPosts.avatar);
});

module.exports = router;
