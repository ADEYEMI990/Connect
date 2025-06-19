import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: User identity is required to generate upload URL.");
  }
  return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"), // Reference to the storage table for the image
  },
  handler: async (ctx, args) => {
    // Ensure the user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User identity is required to create a post.");
    }
    
    const currentUser = await ctx.db.query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();

    if (!currentUser) {
      throw new Error("User not found: Please ensure you are registered.");
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image upload failed: Unable to retrieve image URL.");  

    // Create a new post in the database
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id, // Reference to the user who created the post
      likes: 0, // Initial number of likes
      comments: 0, // Initial number of comments
      imageurl: imageUrl, // URL of the uploaded image
      caption: args.caption,
      storageId: args.storageId,
      
    });

    // increment the user's post count by 1
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId; // Return the ID of the newly created post
  },
});