import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

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
    const currentUser = await getAuthenticatedUser(ctx);

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

export const getFeedPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Fetch posts from the database, ordered by creation time in descending order
    const posts = await ctx.db.query("posts").order("desc").collect();

    if (!posts || posts.length === 0) {
      return []; // Return an empty array if no posts are found
    }

    // enhance posts with userdata and interaction status
    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        // Fetch the user who created the post
        const postAuthor = await ctx.db.get(post.userId);

        // Check if the current user has liked this post
        const Like = await ctx.db.query("likes")
          .withIndex("by_user_and_post", (q) => q
            .eq("userId", currentUser._id)
            .eq("postId", post._id))
          .first();

        // Check if the current user has bookmarks this post
        const bookmarks = await ctx.db.query("bookmarks")
          .withIndex("by_user_and_post", (q) => q
          .eq("userId", currentUser._id)
            .eq("postId", post._id))
          .first();


        // Check if the current user has commented on this post
        // const hasCommented = await ctx.db.query("comments")
        //   .withIndex("by_user_and_post", (q) => q
        //     .eq("userId", currentUser._id)
        //     .eq("postId", post._id))
        //   .first();

        return {
          ...post,
          author:{
            _id:postAuthor?._id,
            username: postAuthor?.username,
            Image:postAuthor?.image
          },
          isLiked: !!Like, // Convert to boolean
          isBookmarked: !!bookmarks, // Convert to boolean
        };
      })
    )

    return postsWithInfo;
  }  
})