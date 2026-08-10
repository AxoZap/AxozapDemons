import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { appendDemonToSheet, updateDemonInSheet, deleteDemonFromSheet } from "./sheets.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Environment variables
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "admin";

// Health check endpoint
app.get("/make-server-7e6e6986/health", (c) => {
  return c.json({ status: "ok" });
});

// Verify admin password
app.post("/make-server-7e6e6986/verify-password", async (c) => {
  try {
    const { password } = await c.req.json();
    const isValid = password === ADMIN_PASSWORD;
    return c.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying password:", error);
    return c.json({ error: "Failed to verify password" }, 500);
  }
});

// Get all demons
app.get("/make-server-7e6e6986/demons", async (c) => {
  try {
    const demons = await kv.getByPrefix("demon:");
    // Sort by ID to maintain insertion order
    const sortedDemons = demons.sort((a: any, b: any) => {
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idA - idB;
    });
    return c.json(sortedDemons);
  } catch (error) {
    console.error("Error fetching demons:", error);
    return c.json({ error: "Failed to fetch demons" }, 500);
  }
});

// Add a new demon (password protected)
app.post("/make-server-7e6e6986/demons", async (c) => {
  try {
    const { password, demon } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const id = Date.now().toString();
    const demonWithId = { ...demon, id };
    await kv.set(`demon:${id}`, demonWithId);

    appendDemonToSheet(demonWithId)
    .then((result) => console.log("🔥 Background sync to Sheets completed:", result))
    .catch((error) => console.error("❌ Background sync to Sheets failed:", error));

    return c.json(demonWithId);
  } catch (error) {
    console.error("Error adding demon:", error);
    return c.json({ error: "Failed to add demon" }, 500);
  }
});

// Delete a demon (password protected)
app.delete("/make-server-7e6e6986/demons/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { password } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const allDemons = await kv.getByPrefix("demon:");
    const sortedDemons = allDemons.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));

    const rank = sortedDemons.findIndex((d: any) => d.id === id) + 1;
    console.log(`🗑️ Deleting demon with ID ${id} at rank ${rank}`);

    await kv.del(`demon:${id}`);

    if (rank > 0) {
      deleteDemonFromSheet(rank)
      .then((result) => console.log("🔥 Background delete from Sheets completed:", result))
      .catch((error) => console.error("❌ Background delete from Sheets failed:", error));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting demon:", error);
    return c.json({ error: "Failed to delete demon" }, 500);
  }
});

// Update a demon (password protected)
app.put("/make-server-7e6e6986/demons/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { password, demon } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const allDemons = await kv.getByPrefix("demon:");
    const sortedDemons = allDemons.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));

    const rank = sortedDemons.findIndex((d: any) => d.id === id) + 1;
    console.log(`✏️ Updating demon with ID ${id} at rank ${rank}`);

    const updatedDemon = { ...demon, id };
    await kv.set(`demon:${id}`, updatedDemon);

    if (rank > 0) {
      updateDemonInSheet(updatedDemon, rank)
      .then((result) => console.log("🔥 Background update to Sheets completed:", result))
      .catch((error) => console.error("❌ Background update to Sheets failed:", error));
    }

    return c.json(updatedDemon);
  } catch (error) {
    console.error("Error updating demon:", error);
    return c.json({ error: "Failed to update demon" }, 500);
  }
});

// Bulk import demons
app.post("/make-server-7e6e6986/demons/bulk", async (c) => {
  try {
    const { password, demons } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    console.log(`📦 Importing ${demons.length} demons...`);

    const importedDemons = [];
    for (let i = 0; i < demons.length; i++) {
      const id = (i + 1).toString();
      const demonWithId = { ...demons[i], id };
      await kv.set(`demon:${id}`, demonWithId);
      importedDemons.push(demonWithId);
    }

    console.log(`✅ Imported ${importedDemons.length} demons with sequential IDs`);
    return c.json({ count: importedDemons.length, demons: importedDemons });
  } catch (error) {
    console.error("Error bulk importing demons:", error);
    return c.json({ error: "Failed to bulk import demons" }, 500);
  }
});

// Clear all demons (password protected)
app.delete("/make-server-7e6e6986/demons/clear", async (c) => {
  try {
    const { password } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const allDemons = await kv.getByPrefix("demon:");
    console.log(`🗑️ Found ${allDemons.length} demons to delete`);

    const keys = allDemons.map((demon: any) => `demon:${demon.id}`);
    if (keys.length > 0) {
      await kv.mdel(keys);
      console.log(`✅ Deleted ${keys.length} demons from database`);
    }

    const remaining = await kv.getByPrefix("demon:");
    return c.json({ success: true, count: keys.length, remaining: remaining.length });
  } catch (error) {
    console.error("Error clearing demons:", error);
    return c.json({ error: "Failed to clear demons" }, 500);
  }
});

// Reset everything
app.post("/make-server-7e6e6986/nuclear-reset", async (c) => {
  try {
    const { password } = await c.req.json();

    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }

    console.log(`💥 NUCLEAR RESET INITIATED`);
    const allDemons = await kv.getByPrefix("demon:");

    let deleted = 0;
    for (const demon of allDemons) {
      try {
        await kv.del(`demon:${demon.id}`);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete demon:${demon.id}`, err);
      }
    }

    const remaining = await kv.getByPrefix("demon:");
    return c.json({ success: true, nuked: deleted, remaining: remaining.length });
  } catch (error) {
    console.error("Error during nuclear reset:", error);
    return c.json({ error: "Failed to reset" }, 500);
  }
});

// In-memory cache for user ID to avoid repeating /api/user/me calls
let cachedGddlUserId: string | number | null = null;

app.get("/make-server-7e6e6986/gddl/:levelId", async (c) => {
  const levelId = c.req.param("levelId");
  if (!levelId || isNaN(Number(levelId))) {
    return c.json({ error: "Invalid level ID" }, 400);
  }

  try {
    const GDDL_API_TOKEN = Deno.env.get("GDDL_API_TOKEN") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AxoZapDemonsList/1.0",
    };

    if (GDDL_API_TOKEN) {
      headers["Authorization"] = GDDL_API_TOKEN.startsWith("Bearer ")
      ? GDDL_API_TOKEN
      : `Bearer ${GDDL_API_TOKEN}`;
    }

    // 1. Fetch public level info (LevelDTO: Rating, Enjoyment, RatingCount, EnjoymentCount, etc.)
    const levelRes = await fetch(`https://gdladder.com/api/level/${levelId}`, { headers });

    let tier: number | null = null;
    let avgEnjoyment: number | null = null;
    let myTier: number | null = null;
    let enjoyment: number | null = null;

    if (levelRes.ok) {
      try {
        const d = await levelRes.json();
        tier = d.Rating ?? d.rating ?? null;
        avgEnjoyment = d.Enjoyment ?? d.enjoyment ?? null;
      } catch (e) {
        console.error(`⚠️ Level ${levelId} response was not valid JSON`);
      }
    }

    // 2. Fetch user's personal rating for this exact level
    if (GDDL_API_TOKEN) {
      // Step A: Dynamically resolve User ID if not already cached
      if (!cachedGddlUserId) {
        try {
          const meRes = await fetch("https://gdladder.com/api/user/me", { headers });
          if (meRes.ok) {
            const meData = await meRes.json();
            cachedGddlUserId = meData.ID ?? meData.id ?? meData.userID ?? null;
            console.log("👤 Resolved GDDL User ID from /api/user/me:", cachedGddlUserId);
          } else {
            console.error(`⚠️ /api/user/me failed [HTTP ${meRes.status}]`);
          }
        } catch (err) {
          console.error("⚠️ Error calling /api/user/me:", err);
        }
      }

      // Step B: Direct lookup for this level ID
      if (cachedGddlUserId) {
        const subRes = await fetch(
          `https://gdladder.com/api/user/${cachedGddlUserId}/submissions/${levelId}`,
          { headers }
        );

        if (subRes.ok) {
          try {
            const match = await subRes.json();
            myTier = match.Rating ?? match.rating ?? match.Tier ?? match.tier ?? null;
            enjoyment = match.Enjoyment ?? match.enjoyment ?? null;
          } catch (e) {
            console.error(`⚠️ Failed to parse submission JSON for level ${levelId}`);
          }
        } else if (subRes.status === 404) {
          console.log(`ℹ️ Level ${levelId} has no rating submission by user ${cachedGddlUserId}`);
        } else {
          console.error(`⚠️ Fetching level submission failed with HTTP ${subRes.status}`);
        }
      }
    }

    return c.json({ tier, avgEnjoyment, myTier, enjoyment });
  } catch (error) {
    console.error("❌ Exception in GDDL handler:", error);
    return c.json({ error: "Failed to fetch GDDL data" }, 500);
  }
});

Deno.serve(app.fetch);
