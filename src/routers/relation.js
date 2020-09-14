const express = require("express");
const Relation = require("../models/Relation");
const auth = require("../middlewares/auth");
const postMiddleware = require("../middlewares/post");

const router = new express.Router();

router.post("/users/me/:id/send", auth, async (req, res) => {
  try {
    if (req.params.id.toString() === req.user._id.toString()) {
      throw new Error();
    }

    let relation = await Relation.findOne({ creator: req.params.id });
    if (relation === null) {
      relation = new Relation({ creator: req.params.id });
    } else {
      const already = await relation.isFollower(req.user);
      if (already) {
        throw new Error();
      }
    }
    relation.pendings = relation.pendings.concat({
      pendingId: req.user._id,
      sent: false,
    });

    let relationTwo = await Relation.findOne({
      creator: req.user._id,
    });
    if (relationTwo === null) {
      relationTwo = new Relation({ creator: req.user._id });
    }
    relationTwo.pendings = relationTwo.pendings.concat({
      pendingId: req.params.id,
      sent: true,
    });

    await relation.save();
    await relationTwo.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

//action=reject
router.post("/users/me/pendings/:id", auth, async (req, res) => {
  try {
    console.log("Done");
    const relation = await Relation.findOne({ creator: req.user._id });
    console.log("Done");
    const pending1 = relation.pendings.findIndex(
      (pending) =>
        pending.pendingId.toString() === req.params.id.toString() &&
        pending.sent === false
    );
    console.log("Done");
    const relation2 = await Relation.findOne({ creator: req.params.id });
    console.log("Done");
    const pending2 = relation2.pendings.findIndex(
      (pending) =>
        pending.pendingId.toString() === req.user._id.toString() &&
        pending.sent === true
    );
    console.log("Done");
    if (pending2 === -1 || pending1 === -1) {
      return res.status(404).send();
    }
    console.log("Done");
    relation.pendings.splice(pending1, 1);
    console.log("Done");
    relation2.pendings.splice(pending2, 1);
    console.log("Done");
    if (req.query.action === "reject") {
      await relation.save();
      await relation2.save();
      return res.status(200).send();
    }
    console.log("Done");
    relation.followers = relation.followers.concat({
      followerId: req.params.id,
    });
    console.log("Done");

    relation2.followings = relation2.followings.concat({
      followingId: req.user._id,
    });
    console.log("Done");
    await relation.save();
    console.log("Done");
    await relation2.save();
    console.log("Done");
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

//limit=10&skip=10
router.get("/users/me/followers", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    if (!relation) {
      return res.status(200).send([]);
    }
    await relation
      .populate({
        path: "followers",
        options: {
          limit: 1,
        },
      })
      .execPopulate();
    res.status(200).send(relation.followers);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me/followings", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    if (!relation) {
      return res.status(200).send([]);
    }
    await relation
      .populate({
        path: "followings",
        options: {
          limit: 1,
        },
      })
      .execPopulate();
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
    await pendingRequests
      .populate({
        path: "relations",
        options: {
          limit: 1,
        },
      })
      .execPopulate();
    res.status(200).send(pendingRequests);
  } catch (err) {
    res.status(500).send();
  }
});

router.get(
  "/users/me/:id/followers",
  auth,
  postMiddleware,
  async (req, res) => {
    res.status(200).send(req.followers);
  }
);

router.get(
  "/users/me/:id/followings",
  auth,
  postMiddleware,
  async (req, res) => {
    res.status(200).send(req.followings);
  }
);

router.delete("/users/me/pendings/sent/:id", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    const relation2 = await Relation.findOne({ creator: req.params.id });
    const pending1 = relation.pendings.findIndex(
      (pending) =>
        pending.pendingId.toString() === req.params.id.toString() &&
        pending.sent === true
    );

    const pending2 = relation2.pendings.findIndex(
      (pending) =>
        pending.pendingId.toString() === req.user._id.toString() &&
        pending.sent === false
    );

    if (pending1 === -1 || pending2 === -1) {
      return res.status(404).send();
    }

    relation.pendings.splice(pending1, 1);
    relation2.pendings.splice(pending2, 1);
    await relation.save();
    await relation2.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.delete("/users/me/followers/:id", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    const relation2 = await Relation.findOne({ creator: req.params.id });
    const follower1 = relation.followers.findIndex(
      (follower) => follower.followerId.toString() === req.params.id.toString()
    );

    const following1 = relation2.followings.findIndex(
      (following) =>
        following.followingId.toString() === req.user._id.toString()
    );
    if (follower1 === -1 || following1 === -1) {
      return res.status(404).send();
    }

    relation.followers.splice(follower1, 1);
    relation2.followings.splice(following1, 1);

    await relation.save();
    await relation2.save();

    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.delete("/users/me/followings/:id", auth, async (req, res) => {
  try {
    const relation = await Relation.findOne({ creator: req.user._id });
    const following1 = relation.followings.findIndex(
      (following) =>
        following.followingId.toString() === req.params.id.toString()
    );
    const relation2 = await Relation.findOne({ creator: req.params.id });
    const follower1 = relation2.followers.findIndex(
      (follower) => follower.followerId.toString() === req.user._id.toString()
    );

    if (following1 === -1 && follower1 === -1) {
      return res.status(404).send();
    }

    relation.followings.splice(following1, 1);
    relation2.followers.splice(follower1, 1);

    await relation.save();
    await relation2.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
