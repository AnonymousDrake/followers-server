const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Post = require("./Post");
const Relation = require("./Relation");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate: (email) => {
        if (!validator.isEmail(email)) {
          throw new Error("Invalid Email Format");
        }
      },
      lowercase: true,
    },
    avatar: {
      type: Buffer,
    },
    avatarURI: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      minLength: [4, "Username must be atleast 4 characters long."],
      maxLength: [24, "Username is too long."],
      trim: true,
      unique: true,
      validate: (username) => {
        if (!username.match(/^[a-zA-Z0-9_]{4,18}$/)) {
          throw new Error("Invalid characters in username!");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(password) {
        if (
          password.length < 6 ||
          password.toLowerCase().includes("password")
        ) {
          throw new Error("Enter a stronger password.");
        }
      },
    },

    name: {
      type: String,
      validate: (name) => {
        if (name.length >= 31) {
          throw new Error("Name is too long.");
        }
      },
      trim: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    bio: {
      type: String,
      trim: true,
      maxLength: [300, "Too long."],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "creator",
});

userSchema.virtual("relations", {
  ref: "Relation",
  localField: "_id",
  foreignField: "creator",
});

userSchema.methods.getAuth = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (
  credential,
  password,
  isEmail
) => {
  const user =
    isEmail === true
      ? await User.findOne({ email: credential })
      : await User.findOne({ username: credential });

  if (!user) {
    throw new Error("Unable to Login!");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login!");
  }
  return user;
};

userSchema.methods.toJSON = function (noAuth) {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  if (noAuth === true) {
    delete userObject.email;
    delete userObject.__v;
  }

  return userObject;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  if (user.isModified("bio")) {
    if (user.bio.length > 300) {
      throw new Error();
    }
  }
  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  await Post.findOneAndDelete({ creator: user._id });
  await Relation.findOneAndDelete({ creator: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
