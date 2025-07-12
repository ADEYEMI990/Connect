import { ConvexError, v } from "convex/values";
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
      imageUrl: imageUrl, // URL of the uploaded image
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
  
    if (!currentUser) throw new ConvexError("Unauthorized: User identity is required to fetch feed posts.");

    // Fetch posts from the database, ordered by creation time in descending order
    const posts = await ctx.db.query("posts").order("desc").collect();

    if (posts.length === 0) return []; // Return an empty array if no posts are found
    
    // enhance posts with userdata and interaction status
    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        // Fetch the user who created the post
        const postAuthor = (await ctx.db.get(post.userId))!;

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
            image:postAuthor?.image
          },
          isLiked: !!Like, // Convert to boolean
          isBookmarked: !!bookmarks, // Convert to boolean
        };
      })
    )

    return postsWithInfo;
  }  
});

export const toggleLike = mutation({
  args: {postId: v.id("posts"), // ID of the post to like/unlike
    },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Check if the post already liked by the user
    const existingLike = await ctx.db.query("likes")
      .withIndex("by_user_and_post", (q) => q
        .eq("userId", currentUser._id)
        .eq("postId", args.postId))
      .first();

      // check if the post exists
    const post = await ctx.db.get(args.postId); 
    if (!post) throw new Error("Post not found");
    
    if (existingLike) {
      // If the post is already liked, remove the like
      await ctx.db.delete(existingLike._id);
      // Decrement the likes count on the post
      await ctx.db.patch(args.postId, { likes: post.likes - 1 });
      return false; // Return false to indicate the post was unliked  
    } else {
      // If the post is not liked, add a new like
      await ctx.db.insert("likes", {
        userId: currentUser._id,
        postId: args.postId,
      });
      // Increment the likes count on the post
      await ctx.db.patch(args.postId, { likes: post.likes + 1 });
      

      // if it's not my post, send a notification to the post author
      if (currentUser._id !== post.userId) {
        await ctx.db.insert("notifications", {
          receiverId: post.userId, 
          type: "like",
          postId: args.postId,
          senderId: currentUser._id, 
        });
      }
      return true; // Return true to indicate the post was liked
    }
  }
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
   
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // verify ownership
    if (post.userId !== currentUser._id) throw new Error("Not authorized to delete this post");

    // delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    // delete associated notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // delete the storage file
    await ctx.storage.delete(post.storageId);

    // delete the post
    await ctx.db.delete(args.postId);

    //decrement user's post count by 1
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });

  },
});

export const getPostByUser = query({
  args: { 
    userId: v.optional(v.id("users")) 
  },
  handler: async (ctx, args) => {
    const user = args.userId ? await ctx.db.get(args.userId) : await getAuthenticatedUser(ctx);

    if (!user) throw new Error("User not found");

    const posts = await ctx.db.query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId || user._id))
      .collect();
      
    return posts;
  },
});
