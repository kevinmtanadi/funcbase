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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Tables />,
      },
      {
        path: "/sql",
        element: <SQLEditor />,
      },
      {
        path: "/function",
        element: <Function />,
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <NextThemesProvider attribute="class" defaultTheme="light">
          <RouterProvider router={router} />
        </NextThemesProvider>
      </NextUIProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
