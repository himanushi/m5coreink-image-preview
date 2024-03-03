import "@picocss/pico/css/pico.amber.min.css";
import { render } from "preact";
import { App } from "./app.tsx";

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
