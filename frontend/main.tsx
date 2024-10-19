import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Tables from "./page/Tables/Tables.tsx";
import SQLEditor from "./page/SQLEditor/SQLEditor.tsx";
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import SignIn from "./page/SignIn.tsx";
import Admin from "./page/Admin/Admin.tsx";
import InitialRegister from "./page/InitialRegister.tsx";
import Setting from "./page/Setting/Setting.tsx";
import Function from "./page/Function/Function.tsx";
import CreateFunction from "./page/Function/CreateFunction.tsx";
import Storage from "./page/Storage/Storage.tsx";
import Backup from "./page/Backup/Backup.tsx";
import Logger from "./page/Logger/Logger.tsx";

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
        path: "/logs",
        element: (
          <ProtectedRoute>
            <Logger />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sql",
        element: (
          <ProtectedRoute>
            <SQLEditor />
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
      {
        path: "/function/create",
        element: (
          <ProtectedRoute>
            <CreateFunction />
          </ProtectedRoute>
        ),
      },
      {
        path: "/backup",
        element: (
          <ProtectedRoute>
            <Backup />
          </ProtectedRoute>
        ),
      },
      {
        path: "/storage",
        element: (
          <ProtectedRoute>
            <Storage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        ),
      },
      {
        path: "/setting",
        element: (
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <InitialRegister />,
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
  cookieSecure: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <NextUIProvider>
          <RouterProvider router={router} />
        </NextUIProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
