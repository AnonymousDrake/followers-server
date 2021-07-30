const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary");
const uploadCloudinary = require("../cloudinary/request");
const User = require("../models/User");
const auth = require("../middlewares/auth");

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
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 180, height: 180 })
        .png()
        .toBuffer();
      await uploadCloudinary(buffer)
        .then((response) => (req.user.avatarURI = response.url))
        .catch(() => {
          throw new Error();
        });
      req.user.avatar = buffer;
      await req.user.save();
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
    if (!req.user.avatar) {
      return res.status(200).send();
    }
    req.user.avatar = undefined;
    const identifier = req.user.avatarURI.split(`foo/`)[1];
    const public_id = "foo/" + identifier.replace(".png", "");

    req.user.avatarURI = undefined;
    await cloudinary.uploader.destroy(public_id);
    await req.user.save();
    res.send();
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

router.get("/users/me/avatar", auth, async (req, res) => {
  try {
    res.status(200).send(req.user.avatar);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/:id/avatar", auth, async (req, res) => {
  const _id = req.params.id;
  const user = await User.findOne({ _id });
  if (!user) {
    return res.status(404).send({ error: "No user found!" });
  }
  if (!user.avatar) {
    return res.status(200).send({ message: "No avatar!" });
  }
  return res.set("Content-Type", "image/png").status(200).send(user.avatar);
});

router.post("/signup", async (req, res) => {
  const user = new User(req.body);

  try {
    const token = await user.getAuth();
    res.status(200).send({ user, token });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

//loginBy=username
router.post("/login", async (req, res) => {
  const loginBy =
    req.query.loginBy === "username" ? req.body.username : req.body.email;
  const isEmail = !(req.query.loginBy === "username");
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

//searchBy=username
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
  const allowedUpdates = ["name", "bio", "username", "password"];
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
    res.status(200).send(req.body);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
