interface Props {
  isOpen: boolean;
  children?: React.ReactNode;
}
const FloatingBox = ({ isOpen, children }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="z-20 absolute top-[87%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
      {children}
    </div>
  );
};

export default FloatingBox;
