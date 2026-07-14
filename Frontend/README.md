# React + Vite

## Debugging in VS Code

This repo has VS Code debug settings in `../.vscode`.

1. Open the repository root in VS Code.
2. Put a breakpoint in a frontend file, for example `src/challenges/Challenges.jsx`.
3. Open the Run and Debug panel.
4. Choose `Frontend: start Vite + debug in Chrome` and press F5.
5. Use the Chrome window that VS Code opens. When the breakpoint is hit, inspect variables, props, hooks, and the call stack in VS Code.

If the frontend is already running on `http://localhost:3000`, choose `Frontend: debug running app in Chrome` instead.

The debug task uses Vite's `--strictPort` flag so debugging does not accidentally open Chrome on port `3000` while Vite moved itself to another port.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
