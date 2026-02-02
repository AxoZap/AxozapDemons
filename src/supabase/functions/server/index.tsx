import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { appendDemonToSheet, updateDemonInSheet, deleteDemonFromSheet } from "./sheets.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

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

// Admin password (stored securely on server)
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
    const sortedDemons = demons.sort((a, b) => {
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
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Generate ID and save
    const id = Date.now().toString();
    const demonWithId = { ...demon, id };
    await kv.set(`demon:${id}`, demonWithId);
    
    // Fire-and-forget: Sync to Google Sheet in the background
    appendDemonToSheet(demonWithId).then(result => {
      console.log('🔥 Background sync to Sheets completed:', result);
    }).catch(error => {
      console.error('❌ Background sync to Sheets failed:', error);
    });
    
    // Return immediately without waiting for sheets sync
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
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get all demons to find the rank before deleting
    const allDemons = await kv.getByPrefix("demon:");
    const sortedDemons = allDemons.sort((a, b) => {
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idA - idB;
    });
    
    // Find the rank (position in sorted list, 1-indexed)
    const rank = sortedDemons.findIndex(d => d.id === id) + 1;
    console.log(`🗑️ Deleting demon with ID ${id} at rank ${rank}`);
    
    // Delete the demon
    await kv.del(`demon:${id}`);
    
    // Fire-and-forget: Delete from Google Sheet in the background
    if (rank > 0) {
      deleteDemonFromSheet(rank).then(result => {
        console.log('🔥 Background delete from Sheets completed:', result);
      }).catch(error => {
        console.error('❌ Background delete from Sheets failed:', error);
      });
    }
    
    // Return immediately without waiting for sheets sync
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
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get all demons to find the rank
    const allDemons = await kv.getByPrefix("demon:");
    const sortedDemons = allDemons.sort((a, b) => {
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idA - idB;
    });
    
    // Find the rank (position in sorted list, 1-indexed)
    const rank = sortedDemons.findIndex(d => d.id === id) + 1;
    console.log(`✏️ Updating demon with ID ${id} at rank ${rank}`);
    
    // Update the demon (preserve the ID)
    const updatedDemon = { ...demon, id };
    await kv.set(`demon:${id}`, updatedDemon);
    
    // Fire-and-forget: Update in Google Sheet in the background
    if (rank > 0) {
      updateDemonInSheet(updatedDemon, rank).then(result => {
        console.log('🔥 Background update to Sheets completed:', result);
      }).catch(error => {
        console.error('❌ Background update to Sheets failed:', error);
      });
    }
    
    // Return immediately without waiting for sheets sync
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
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    console.log(`📦 Importing ${demons.length} demons...`);
    
    // Import all demons with sequential IDs to preserve order
    const importedDemons = [];
    for (let i = 0; i < demons.length; i++) {
      // Use sequential ID: 1, 2, 3, etc. - this preserves spreadsheet order
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
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get all demons
    const allDemons = await kv.getByPrefix("demon:");
    console.log(`🗑️ Found ${allDemons.length} demons to delete`);
    
    // Delete all demons
    const keys = allDemons.map((demon: any) => `demon:${demon.id}`);
    if (keys.length > 0) {
      console.log(`🗑️ Deleting keys:`, keys.slice(0, 5), '...'); // Show first 5
      await kv.mdel(keys);
      console.log(`✅ Deleted ${keys.length} demons from database`);
    }
    
    // Verify deletion
    const remaining = await kv.getByPrefix("demon:");
    console.log(`📊 Remaining demons after deletion: ${remaining.length}`);
    
    return c.json({ success: true, count: keys.length, remaining: remaining.length });
  } catch (error) {
    console.error("Error clearing demons:", error);
    return c.json({ error: "Failed to clear demons" }, 500);
  }
});

// NUCLEAR OPTION: Reset everything (password protected, no confirmation)
app.post("/make-server-7e6e6986/nuclear-reset", async (c) => {
  try {
    const { password } = await c.req.json();
    
    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    console.log(`💥 NUCLEAR RESET INITIATED`);
    
    // Get all demons
    const allDemons = await kv.getByPrefix("demon:");
    console.log(`🗑️ Found ${allDemons.length} demons to NUKE`);
    
    // Delete them ONE BY ONE to ensure they're really gone
    let deleted = 0;
    for (const demon of allDemons) {
      try {
        await kv.del(`demon:${demon.id}`);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete demon:${demon.id}`, err);
      }
    }
    
    console.log(`💥 NUKED ${deleted} demons from database`);
    
    // Verify deletion
    const remaining = await kv.getByPrefix("demon:");
    console.log(`📊 Remaining after nuke: ${remaining.length}`);
    
    if (remaining.length > 0) {
      console.error(`⚠️ WARNING: ${remaining.length} demons still exist!`, remaining.map(d => d.id));
    }
    
    return c.json({ success: true, nuked: deleted, remaining: remaining.length });
  } catch (error) {
    console.error("Error during nuclear reset:", error);
    return c.json({ error: "Failed to reset" }, 500);
  }
});

Deno.serve(app.fetch);