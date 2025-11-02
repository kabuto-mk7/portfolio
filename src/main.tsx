// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./App.css";

class Boundary extends React.Component<{children: React.ReactNode}, {err?: any}> {
  state = { err: undefined as any };
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any, info: any) { console.error("App crashed:", err, info); }
  render() {
    return this.state.err
      ? <pre style={{whiteSpace:"pre-wrap",background:"#200",color:"#faa",padding:16,height:"100vh",margin:0}}>
          {String(this.state.err?.stack || this.state.err)}
        </pre>
      : this.props.children as any;
  }
}

console.log("main.tsx loaded (App)");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>
);
