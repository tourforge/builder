import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { build } from "esbuild";
import { type PluginContext } from "rollup";
// import devtools from 'solid-devtools/vite';

const runBundleScriptBundler = async (ctx: PluginContext) => {
  const result = await build({
    bundle: true,
    minify: true,
    entryPoints: ["src/bundle/index.ts"],
    outfile: "gen/bundle/index.js",
  });

  if (result.errors.length > 0) {
    ctx.error("Project export script bundling errors: " + result.errors.toString());
  }

  if (result.warnings.length > 0) {
    ctx.warn("Project export script bundling warnings: " + result.warnings.toString());
  }

  if (result.errors.length === 0) {
    ctx.info("Successfully bundled project export script.");
  }
};

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/builder/" : "/",
  plugins: [
    /*
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
    // This custom plugin (and the function above the defineConfig) use ESBuild to
    // bundle src/bundle/index.ts, which is the script linked by every exported project
    // bundle. We have to manually call ESBuild because our code needs access to the
    // bundled code to put into the project bundle, unlike the typical use-case, where
    // the desire is to be able to *run* bundled code.
    {
      name: "bundle-index",
      async buildStart() {
        this.addWatchFile("src/bundle/index.ts");

        await runBundleScriptBundler(this);
      },
      async watchChange(id) {
        if (id.endsWith("src/bundle/index.ts")) {
          await runBundleScriptBundler(this);
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
}));
