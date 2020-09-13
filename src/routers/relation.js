const express = require("express");
const Relation = require("../models/Relation");
const auth = require("../middlewares/auth");
const postMiddleware = require("../middlewares/post");

const router = new express.Router();

router.post("/users/me/:id/send", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.params.id });
    const already = relation.pendings.find(async (pending) => {
      pending.pendingId === req.user._id && sent === false;
    });
    if (already) {
      throw new Error();
    }
    relation.pendings = relation.pendings.concat({
      pendingId: req.user._id,
      sent: false,
    });
    await relation.save();
    const relation2 = await Relation.findOne({ creator: req.user._id });
    relation2.pendings = relation2.pendings.concat({
      pendingId: req.params.id,
      sent: true,
    });
    await relation2.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

//action=reject
router.post("/users/me/pendings/:id", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    relation.pendings = relation.pendings.filter((pending) => {
      if (
        pending.pendingId.toString() === req.params.id &&
        pending.sent === true
      ) {
        return true;
      } else return false;
    });

    const relation2 = await Relation.findOne({ creator: req.params.id });

    relation2.pendings = relation2.pendings.filter((pending) => {
      if (
        pending.pendingId.toString() === req.user._id &&
        pending.sent === false
      ) {
        return true;
      } else return false;
    });

    if (req.query.action === "reject") {
      await relation2.save();
      await relation.save();
      return res.status(200).send();
    }

    relation.followers = relation.followers.concat({
      followerId: req.params.id,
    });
    await relation.save();

    relation2.followings = relation2.followings.concat({
      followingId: req.user._id,
    });
    await relation2.save();

    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/followers", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    res.status(200).send(relation.followers);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/followings", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    res.status(200).send(relation.followings);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/pendings", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    const pendingRequests = relation.pendings.filter(
      (pending) => pending.sent === false
    );
    res.status(200).send(pendingRequests);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/:id/followers", auth, postMiddleware, async (req, res) => {
  res.status(200).send(req.followers);
});

router.get("/users/:id/followings", auth, postMiddleware, async (req, res) => {
  res.status(200).send(req.followings);
});

router.delete("/users/me/pendings/:id", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    relation.pendings = relation.pendings.filter((pending) => {
      if (pending.pendingId === req.params.id && sent === true) {
        return false;
      } else return true;
    });
    await relation.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
