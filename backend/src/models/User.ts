import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

// Interface for the User document
export interface IUser extends Document {
  _id: any
  email: string
  password: string
  matchPassword(enteredPassword: string): Promise<boolean>
  hasSeenTutorial: boolean
}

// Interface for the User model (for static methods, if any)
export interface IUserModel extends Model<IUser> {}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    hasSeenTutorial: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema)

export default User 