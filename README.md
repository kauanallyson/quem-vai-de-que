# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR, using [Biome](https://biomejs.dev) for linting and formatting.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Linting and formatting

[Biome](https://biomejs.dev) is used as both linter and formatter, configured in `biome.json`.

- `bun run lint` — lint the project
- `bun run format` — format all files
- `bun run check` — format, lint and organize imports, applying safe fixes
