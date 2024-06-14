import { Input } from "@nextui-org/react";
import { HiOutlineHashtag } from "react-icons/hi";

interface NumberInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: () => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}
const NumberInput = ({
  id,
  name,
  value,
  label,
  onChange,
  isRequired,
  isDisabled,
}: NumberInputProps) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow backspace, delete, tab, escape, enter, and navigation keys
    if (
      [8, 46, 9, 27, 13, 37, 38, 39, 40].includes(event.keyCode) ||
      // Allow Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+X
      ((event.key === "a" || event.key === "c" || event.key === "x") &&
        (event.ctrlKey || event.metaKey))
    ) {
      return;
    }

    // Allow digits and a single decimal point
    if (!/^[0-9.]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  return (
    <Input
      isDisabled={isDisabled}
      id={id}
      name={name}
      onKeyDown={handleKeyDown}
      onChange={onChange}
      value={value}
      variant="bordered"
      classNames={{
        inputWrapper: "rounded-md",
        label: "text-md font-semibold",
      }}
      size="md"
      fullWidth
      labelPlacement="inside"
      label={
        <div className="flex gap-2 items-center">
          <HiOutlineHashtag />
          <div className="flex items-center">
            <p>{label}</p>
            {isRequired && (
              <span className="ml-[2px] mb-1 text-red-500">*</span>
            )}
          </div>
        </div>
      }
      type="number"
    />
  );
};

export default NumberInput;
