import { MainLayout } from "../components/layout/MainLayout";
import "./reference.css";
import "./themes.css";
import "./workspace.css";
import { PreferencesProvider } from "../features/preferences/PreferencesProvider";

export default function App() {
  return <PreferencesProvider><MainLayout /></PreferencesProvider>;
}
