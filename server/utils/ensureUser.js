import { clerkClient } from '@clerk/express'
import User from '../models/User.js'

// Ensures webhook delivery is not a single point of failure for user provisioning.
export const ensureUser = async (userId) => {
  const existingUser = await User.findById(userId)

  if (existingUser) {
    return existingUser
  }

  const clerkUser = await clerkClient.users.getUser(userId)
  const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress

  if (!email) {
    throw new Error('The Clerk user does not have an email address')
  }

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || email
  const userData = {
    _id: userId,
    email,
    name,
    image: clerkUser.imageUrl,
    resume: '',
  }

  try {
    return await User.findOneAndUpdate(
      { _id: userId },
      { $setOnInsert: userData },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
  } catch (error) {
    // A concurrent authenticated request may have created the same user first.
    if (error.code === 11000) {
      const user = await User.findById(userId)
      if (user) return user
    }

    throw error
  }
}
