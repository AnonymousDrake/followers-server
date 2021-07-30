const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary");
const uploadCloudinary = require("../cloudinary/request");
const auth = require("../middlewares/auth");
const postMiddleware = require("../middlewares/post");
const Post = require("../models/Post");

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
  "/users/me/posts",
  auth,
  upload.single("post"),
  async (req, res) => {
    const post = new Post({ creator: req.user._id });
    try {
      const buffer = await sharp(req.file.buffer)
        .png()
        .resize({ height: 250, width: 250 })
        .toBuffer();
      await uploadCloudinary(buffer)
        .then((response) => (post.uri = response.url))
        .catch((err) => {
          throw new Error();
        });
      if (!!req.body.captions) {
        post.captions = req.body.captions;
      }
      post.data = buffer;
      await post.save();
      res.status(200).send(post);
    } catch (err) {
      console.log(err);
      res.status(500).send();
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error });
  }
);

router.get("/users/me/posts", auth, async (req, res) => {
  try {
    const userPosts = await Post.find({ creator: req.user._id });
    if (!userPosts) {
      return res.status(200).send([]);
    }
    res.status(200).send({ number: userPosts.length, posts: userPosts });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

router.get("/users/me/posts/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      creator: req.user._id,
      _id: req.params.postId,
    });
    if (!post) {
      return res.status(404).send();
    }
    res.status(200).send(post);
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
    if (!post) {
      return res.status(404).send({ message: "No post found!" });
    }
    res.status(200).send(post);
  }
);

router.delete("/users/me/posts/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      creator: req.user._id,
      _id: req.params.postId,
    });
    if (!post) {
      return res.status(404).send();
    }
    const identifier = post.uri.split(`foo/`)[1];
    const public_id = "foo/" + identifier.replace(".png", "");
    await cloudinary.uploader.destroy(public_id);
    await post.remove();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
