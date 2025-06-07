import mongoose from 'mongoose'

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    graphData: {
      nodes: { type: Array, required: true },
      edges: { type: Array, required: true },
    },
    inputs: {
      textInput: { type: String },
      imageFileName: { type: String },
      audioFileName: { type: String },
      audioVideoURL: { type: String },
    },
  },
  {
    timestamps: true,
  }
)

const History = mongoose.model('History', historySchema)

export default History 