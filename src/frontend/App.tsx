import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbCode } from "react-icons/tb";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import { CgDatabase } from "react-icons/cg";
import { LuUsers2 } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./pkg/axiosInstance";
import { BiWrench } from "react-icons/bi";

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
  {
    name: "Settings",
    path: "/setting",
    icon: BiWrench,
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
      const maxAttempts = 5;
      let attempts = 0;

      const checkAuthentication = () => {
        attempts++;
        if (!isAuth && attempts < maxAttempts) {
          setTimeout(checkAuthentication, 100);
        } else {
          if (!isAuth) {
            window.location.href = "/signin";
          }
        }
      };

      checkAuthentication();
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
