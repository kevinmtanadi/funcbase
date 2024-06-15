import Sidebar from "./Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbCode, TbMathFunction, TbTable } from "react-icons/tb";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";

const tabs = [
  {
    name: "Home",
    path: "/",
    icon: TbTable,
  },
  {
    name: "SQL Editor",
    path: "/sql",
    icon: TbCode,
  },
  {
    name: "Functions",
    path: "/function",
    icon: TbMathFunction,
  },
];

const checkAuth = () => {
  const isAuth = useIsAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/signin" />;
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
