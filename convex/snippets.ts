import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";


export const createSnippet = mutation({
    args: {
        title: v.string(),
        language: v.string(),
        code: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) throw new ConvexError("Unauthorized");

        const user = await ctx.db.query("users")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("userId"), identity.subject)).first();

        if (!user) {
            throw new ConvexError("User not found");
        }

        const snippetId = await ctx.db.insert("snippets", {
            title: args.title,
            language: args.language,
            code: args.code,
            userId: identity.subject,
            userName: user.name
        });

        return snippetId

    }
})