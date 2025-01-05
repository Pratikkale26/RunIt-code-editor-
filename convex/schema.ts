import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema ({
    users: defineTable({
        userId: v.string(),
        name: v.string(),
        email: v.string(),
        isPro: v.boolean(),
        ProSince: v.optional(v.number()),
        lemonSqueezyCustomerId: v.optional(v.string()),
        lemonSqueezyOrderId: v.optional(v.string()),
    }).index("by_user_id", ["userId"]),

    codeExecutions: defineTable({
        userId: v.string(),
        language: v.string(),
        code: v.string(),
        output: v.optional(v.string()),
        error: v.optional(v.string()),
    }).index("by_user_id", ["userId"]),

})