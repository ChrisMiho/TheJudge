import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tailwind-base.css";
import "./styles/tokens.css";
import "./lib/theme/glows.css";
import "./styles/shell.css";
import "./styles/ambience.css";
import "./styles/flow.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
