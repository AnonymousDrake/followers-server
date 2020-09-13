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
      },
    },
  ],
  followers: [
    {
      followerId: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
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

const Relation = mongoose.model("Relation", relationSchema);

module.exports = Relation;
