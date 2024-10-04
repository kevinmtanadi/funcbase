import { Input } from "@nextui-org/react";
import { RiText } from "react-icons/ri";

interface TextInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: () => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}
const TextInput = ({
  id,
  name,
  value,
  label,
  onChange,
  isRequired,
  isDisabled,
}: TextInputProps) => {
  return (
    <Input
      isDisabled={isDisabled}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
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
          <RiText />
          <div className="flex items-center">
            <p>{label}</p>
            {isRequired && (
              <span className="ml-[2px] mb-1 text-red-500">*</span>
            )}
          </div>
        </div>
      }
      type="text"
    />
  );
};

export default TextInput;
