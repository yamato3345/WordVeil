import ReactDOM from "react-dom/client";
import App from "./app/App";
import { applyTheme, readPreferences } from "./features/preferences/preferences";

applyTheme(readPreferences().theme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
