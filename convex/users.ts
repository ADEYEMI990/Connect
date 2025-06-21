import { mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Create a new user with the given details
export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the user already exists in the database
    const existingUser = await ctx.db.query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

      if (existingUser) return;

    // create a user in db
    await ctx.db.insert("users", {
      username: args.username,  // Username of the user
      fullname: args.fullname,  // Full name of the user
      email: args.email,  // Email address of the user
      bio: args.bio,  // Bio of the user
      image: args.image,  // Profile image URL of the user
      followers: 0,  // Initial number of followers
      following: 0,  // Initial number of following
      posts: 0,  // Initial number of posts
      clerkId: args.clerkId,  // Clerk ID of the user
    });
  },
});

export async function getAuthenticatedUser(ctx:QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User identity is required to fetch feed posts.");
    }

    const currentUser = await ctx.db.query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();

    if (!currentUser) {
      throw new Error("User not found: Please ensure you are registered.");
    }

    return currentUser;
}