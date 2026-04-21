import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    techstack: {
      type: [String],
      required: true,
    },
    questions: {
      type: [String],
      required: true,
    },
    finalized: {
      type: Boolean,
      default: true,
    },
    coverImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
