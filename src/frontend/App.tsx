import Sidebar from "./Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbCode } from "react-icons/tb";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import { CgDatabase } from "react-icons/cg";
import { LuUsers2 } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./pkg/axiosInstance";

const tabs = [
  {
    name: "Database",
    path: "/",
    icon: CgDatabase,
  },
  {
    name: "SQL Editor",
    path: "/sql",
    icon: TbCode,
  },
  {
    name: "Admins",
    path: "/admin",
    icon: LuUsers2,
  },
];

const checkAuth = () => {
  const { data: admin, isLoading } = useQuery<any>({
    queryKey: ["admin"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/admin");
      return data;
    },
  });

  if (isLoading || !admin) {
    return <>Loading...</>;
  }

  if (admin.rows.length === 0) {
    console.log(admin.rows.length);
    window.location.href = "/signup";
    return <></>;
  }

  const isAuth = useIsAuthenticated();
  if (admin?.rows.length > 0) {
    if (!isAuth) {
      window.location.href = "/signin";
    }
  }
};

function App() {
  checkAuth();

  return (
    <>
      <div className="max-h-screen overflow-hidden h-screen w-full flex">
        <div className="">
          <Sidebar tabs={tabs} />
        </div>
        <div className="w-full">
          <Outlet />
          <ToastContainer draggable position="bottom-center" />
        </div>
      </div>
    </>
  );
}

export default App;
