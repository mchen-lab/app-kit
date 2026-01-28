import "./styles.css";
import { initApp } from "./app";

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("root");
  if (app) {
    initApp(app);
  }
});
