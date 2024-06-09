import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbCode, TbMathFunction, TbTable } from "react-icons/tb";

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

function App() {
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
