import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { isSliderLimits } from "./src/sliderLimits";

const limitsFile = path.join(fileURLToPath(new URL(".", import.meta.url)), "src/slider-limits.json");

function sliderLimitsPlugin(): Plugin {
  return {
    name: "slider-limits",
    configureServer(server) {
      server.middlewares.use("/api/slider-limits", (req, res) => {
        if (req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(fs.readFileSync(limitsFile, "utf8"));
          return;
        }
        if (req.method !== "PUT") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (!isSliderLimits(parsed)) {
              res.statusCode = 400;
              res.end("Each limit needs a min below its max.");
              return;
            }
            fs.writeFileSync(limitsFile, `${JSON.stringify(parsed, null, 2)}\n`);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(parsed));
          } catch {
            res.statusCode = 400;
            res.end("Could not save slider limits.");
          }
        });
      });
    },
    handleHotUpdate(ctx) {
      if (ctx.file === limitsFile) return [];
    },
  };
}

export default defineConfig({
  plugins: [react(), sliderLimitsPlugin()],
  server: { port: 5173 },
});
