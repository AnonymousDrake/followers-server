const mongoose = require("mongoose");

const relationSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  followings: [
    {
      followingId: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
        sparse: true,
      },
    },
  ],
  followers: [
    {
      followerId: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
        sparse: true,
      },
    },
  ],
  pendings: [
    {
      pendingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      sent: {
        type: Boolean,
        required: true,
      },
      timings: {
        type: Date,
        default: Date.now(),
        required: true,
      },
    },
  ],
});

relationSchema.methods.isFollower = async function (user) {
  const relation = this;

  const already1 = relation.pendings.find(
    (pending) =>
      pending.pendingId.toString() === user._id.toString() &&
      pending.sent === false
  );

  const already2 = relation.followers.find(
    (follower) => follower.followerId.toString() === user._id.toString()
  );

  if (!!already1 || !!already2) {
    return true;
  }

  return false;
};

const Relation = mongoose.model("Relation", relationSchema);

module.exports = Relation;
