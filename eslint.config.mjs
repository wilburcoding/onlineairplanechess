import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals"; // You might need to install this: npm install globals -D

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  prettier,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // This tells ESLint which "Global" variables are allowed
      globals: {
        ...globals.browser, // Fixes 'console' error
        ...globals.node, // Allows 'process' or 'require' in server files
        ...globals.jquery, // Fixes '$' errors
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      // This line tells Prettier to stop caring about Windows vs Linux line endings
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
];
