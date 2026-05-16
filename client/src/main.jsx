import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/index.js";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Redux Provider — makes store available to all components */}
    <Provider store={store}>
      {/* PersistGate — delays rendering until persisted state is loaded */}
      <PersistGate loading={null} persistor={persistor}>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15, 15, 25, 0.95)",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#080810" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#080810" },
            },
          }}
        />
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
