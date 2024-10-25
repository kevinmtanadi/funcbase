import Sidebar from "./Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbCode } from "react-icons/tb";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import { CgDatabase } from "react-icons/cg";
import { LuFunctionSquare, LuUsers2, LuDatabaseBackup } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./pkg/axiosInstance";
import { BiWrench } from "react-icons/bi";
import { AiOutlineTable } from "react-icons/ai";
import { GoGraph } from "react-icons/go";

const tabs = [
  {
    name: "Database",
    path: "/",
    icon: AiOutlineTable,
  },
  {
    name: "Logs",
    path: "/logs",
    icon: GoGraph,
  },
  {
    name: "SQL Editor",
    path: "/sql",
    icon: TbCode,
  },
  {
    name: "Functions",
    path: "/function",
    icon: LuFunctionSquare,
  },
  {
    name: "Storage",
    path: "/storage",
    icon: CgDatabase,
  },
  {
    name: "Backup",
    path: "/backup",
    icon: LuDatabaseBackup,
  },
  {
    name: "Admins",
    path: "/admin",
    icon: LuUsers2,
  },
  {
    name: "Settings",
    path: "/setting",
    icon: BiWrench,
  },
];

function App() {
  const { data: admin, isLoading } = useQuery<any>({
    queryKey: ["admin"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/admin");
      return res.data.data;
    },
  });

  const isAuth = useIsAuthenticated();
  if (isLoading || !admin) {
    return <>Loading...</>;
  }

  if (admin?.rows.length === 0) {
    return <Navigate to="/signup" />;
  }

  if (!isAuth) {
    return <Navigate to="/signin" />;
  }

  return (
    <>
      <div className="max-h-screen overflow-hidden h-screen w-full flex">
        <div className="">
          <Sidebar tabs={tabs} />
        </div>
        <div className="w-full">
          <Outlet />
          <ToastContainer
            draggable
            position="top-right"
            pauseOnFocusLoss={false}
            pauseOnHover={false}
          />
        </div>
      </div>
    </>
  );
}

export default App;
