/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom", // necesario para probar componentes React
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest", // usa Babel para transpilar
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  moduleNameMapper: {
    // 🔹 Soporte para imports con "@/..."
    "^@/(.*)$": "<rootDir>/src/$1",
    // 🔹 Soporte para CSS/imagenes en tests
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"], // extiende expect con jest-dom
};

export default config;
