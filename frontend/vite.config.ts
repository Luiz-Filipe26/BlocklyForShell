import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    const FRONTEND_DEV_PORT = parseInt(env.VITE_FRONTEND_DEV_PORT) || 5173;
    const BACKEND_URL = env.BACKEND_URL || "http://localhost:7000";

    return {
        plugins: [tsconfigPaths()],
        root: "src/pages",
        publicDir: path.resolve(__dirname, "public"),

        server: {
            port: FRONTEND_DEV_PORT,
            strictPort: true,
            proxy: {
                "/api": {
                    target: BACKEND_URL,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },

        build: {
            outDir: path.resolve(__dirname, "dist"),
            emptyOutDir: true,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ["blockly"],
                    },
                },
            },
        },
    };
});
