import * as esbuild from "esbuild"
import { mkdirSync } from "fs"

const isWatch = process.argv.includes("--watch")

const buildOptions = {
  entryPoints: ["src/index.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "VetChatbot",
  target: ["es2020"],
  outfile: "../server/dist/chatbot.js",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  loader: {
    ".jsx": "jsx",
  },
  jsxFactory: "h",
  jsxFragment: "Fragment",
}

// Ensure dist directory exists
mkdirSync("../server/dist", { recursive: true })

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions)
      await ctx.watch()
      console.log("Watching for changes...")
    } else {
      await esbuild.build(buildOptions)
      console.log("SDK built successfully!")
    }
  } catch (error) {
    console.error("Build failed:", error)
    process.exit(1)
  }
}

build()
