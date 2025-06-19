import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SocketProvider } from "./context/socketContext.jsx";
import { Provider } from "react-redux";
import store from "./store/store.js";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <SocketProvider>
      <App />
    </SocketProvider>
  </Provider>
);
