import classNames from "classnames";

interface Props {
  isOpen: boolean;
  children?: React.ReactNode;
}
const FloatingBox = ({ isOpen, children }: Props) => {
  console.log(isOpen);
  if (!isOpen) {
    return null;
  }
  return (
    <div
      className={classNames({
        "z-20 absolute transition-all top-[87%] left-[50%] translate-x-[-50%] translate-y-[-50%]":
          true,
        "opacity-0 translate-y-[-10%]": !isOpen,
        "opacity-100 ": isOpen,
      })}
    >
      {children}
    </div>
  );
};

export default FloatingBox;
