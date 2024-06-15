import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Tables from "./page/Tables/Tables.tsx";
import SQLEditor from "./page/SQLEditor.tsx";
import Function from "./page/Function/Function.tsx";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import SignIn from "./page/SignIn.tsx";
import refresh from "./utils/refresh.js";
import Cookies from "cookie-ts";
import axios from "axios";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Tables />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sql",
        element: (
          <ProtectedRoute>
            <SQLEditor />,
          </ProtectedRoute>
        ),
      },
      {
        path: "/function",
        element: (
          <ProtectedRoute>
            <Function />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
]);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const store = createStore({
  authName: "_auth",
  authType: "cookie",
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === "https:",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <NextUIProvider>
          <NextThemesProvider attribute="class" defaultTheme="light">
            <RouterProvider router={router} />
          </NextThemesProvider>
        </NextUIProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
