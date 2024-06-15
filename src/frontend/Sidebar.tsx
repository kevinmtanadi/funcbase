import { useEffect } from "react";
import classname from "classnames";
import { IconType } from "react-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  SwitchProps,
  Tooltip,
  useSwitch,
  VisuallyHidden,
} from "@nextui-org/react";
import { FaMoon, FaSun } from "react-icons/fa6";
import { useTheme } from "next-themes";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import { IoMdExit } from "react-icons/io";

export interface Tab {
  name: string;
  path: string;
  icon: IconType;
}

interface SidebarProps {
  tabs: Tab[];
}
const Sidebar = ({ tabs }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="pt-4 sticky top-0 flex flex-col justify-between h-full w-[65px] bg-slate-200">
      <div className="flex flex-col gap-4 items-center">
        {tabs.map((tab) => (
          <SidebarItem key={tab.name} tab={tab} active={pathname == tab.path} />
        ))}
      </div>
      <div className="mb-5 flex flex-col items-center">
        <SignOutButton />
      </div>
    </div>
  );
};

const SignOutButton = () => {
  const signOut = useSignOut();
  const navigate = useNavigate();

  const handleSignout = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <Tooltip radius="sm" placement="right" content={"Logout"}>
      <div
        onClick={handleSignout}
        className="cursor-pointer hover:bg-slate-300 items-center justify-center flex w-[45px] h-[45px] transition-colors rounded-lg"
      >
        <IoMdExit size={"1.6rem"} />
      </div>
    </Tooltip>
  );
};

interface SidebarItemProps {
  tab: Tab;
  active: boolean;
}
const SidebarItem = ({ tab, active }: SidebarItemProps) => {
  return (
    <Link key={tab.name} to={tab.path}>
      <Tooltip radius="sm" placement="right" content={tab.name}>
        <div
          className={classname({
            "items-center justify-center flex w-[45px] h-[45px] transition-colors rounded-lg":
              true,
            "border-2 border-black": active,
            "hover:bg-slate-300": !active,
          })}
        >
          <tab.icon size={"1.6rem"} />
        </div>
      </Tooltip>
    </Link>
  );
};

export default Sidebar;

function ThemeSwitcher(props: SwitchProps) {
  const { setTheme } = useTheme();

  const {
    Component,
    slots,
    isSelected,
    getBaseProps,
    getInputProps,
    getWrapperProps,
  } = useSwitch(props);

  useEffect(() => {
    if (!isSelected) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }, [isSelected]);

  return (
    <Tooltip radius="sm" placement="right" content="Toggle Dark Mode">
      <Component {...getBaseProps()}>
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <div
          {...getWrapperProps()}
          className={slots.wrapper({
            class: [
              "mr-0",
              "w-[45px] h-[45px]",
              "flex items-center justify-center",
              "rounded-lg bg-transparent hover:bg-slate-300",
              'group[data-selected="true"]:bg-transparent group-data-[selected=true]:bg-transparent',
              " group-data-[selected=true]:hover:bg-slate-300",
            ],
          })}
        >
          {isSelected ? <FaSun /> : <FaMoon />}
        </div>
      </Component>
    </Tooltip>
  );

  // return (
  //   <div className="flex gap-2">
  //     <Switch
  //       classNames={{
  //         wrapper:
  //           'group[data-selected="true"]:bg-slate-950 group-data-[selected=true]:bg-slate-950',
  //         label: "hidden w-0",
  //       }}
  //       size="sm"
  //       endContent={undefined}
  //       color="primary"
  //       isSelected={theme === "dark"}
  //       thumbIcon={({ isSelected, className }) =>
  //         isSelected ? (
  //           <FaMoon className={className} />
  //         ) : (
  //           <FaSun className={className} />
  //         )
  //       }
  //       onValueChange={toggleDarkMode}
  //     />
  //   </div>
  // );
}
