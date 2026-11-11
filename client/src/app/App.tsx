import { MainLayout } from "../components/layout/MainLayout";
import "./reference.css";
import "./themes.css";
import "./workspace.css";
import { PreferencesProvider } from "../features/preferences/PreferencesProvider";
import { AuthProvider } from "../features/auth/AuthProvider";

export default function App() {
  return <PreferencesProvider><AuthProvider><MainLayout /></AuthProvider></PreferencesProvider>;
}
