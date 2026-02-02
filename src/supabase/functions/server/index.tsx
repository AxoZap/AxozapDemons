import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
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
    
    return c.json(demonWithId);
  } catch (error) {
    console.error("Error adding demon:", error);
    return c.json({ error: "Failed to add demon" }, 500);
  }
});

Deno.serve(app.fetch);