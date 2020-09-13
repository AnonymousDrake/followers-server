const express = require("express");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const Relation = require("../models/Relation");
const Post = require("../models/Post");

const router = new express.Router();

router.post("/signup", async (req, res) => {
  const user = new User(req.body);
  const relation = new Relation({ creator: user._id });
  const post = new Post({ creator: user._id });
  try {
    const duplicate = await user.duplicateEmail();
    if (duplicate === true) {
      throw new Error();
    }
    const token = await user.getAuth();
    await user.save();
    await relation.save();
    await post.save();
    res.status(200).send({ user, token });
  } catch (err) {
    res.status(500).send();
  }
});

//loginBy=username
router.post("/login", async (req, res) => {
  const loginBy =
    req.query.loginBy === "username" ? req.body.username : req.body.email;
  const isEmail = !req.query.loginBy === "username";
  try {
    const user = await User.findByCredentials(
      loginBy,
      req.body.password,
      isEmail
    );
    const token = await user.getAuth();

    res.status(200).send({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.status(200).send(req.user);
});

router.delete("/users/me/delete", auth, async (req, res) => {
  const user = req.user;
  try {
    await user.remove();
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const user =
      req.query.searchBy === "username"
        ? await User.findOne({ username: _id })
        : await User.findOne({ _id });

    if (!user) {
      return res.status(404).send();
    }
    const toShare = user.toJSON(true);
    res.status(200).send(toShare);
  } catch (err) {
    res.status(500).send();
  }
});

router.post("/users/me/logout", auth, async (req, res) => {
  const userToken = req.token;
  const user = req.user;
  try {
    const index = await user.tokens.findIndex(
      async (token) => token.token === userToken
    );
    user.tokens[index].remove();
    await user.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.post("/users/me/logoutAll", auth, async (req, res) => {
  const user = req.user;
  try {
    user.tokens = [];
    await user.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const allowedUpdates = ["name", "bio", "birthday", "username", "password"];
  const updates = Object.keys(req.body);
  const isAllowed = updates.every((update) => allowedUpdates.includes(update));
  if (!isAllowed) {
    return res.status(400).send({ error: "Invalid updates." });
  }
  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
