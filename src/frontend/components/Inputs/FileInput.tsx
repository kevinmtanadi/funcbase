import { useRef } from "react";
import { FaRegFile } from "react-icons/fa6";

interface FileInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}
const FileInput = ({ id, name, label, value, onChange }: FileInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        className="px-3 cursor-pointer py-2 w-full border-2 border-default-200 shadow-sm hover:border-default-400 flex flex-col rounded-md"
      >
        <div className="flex items-center gap-2">
          <FaRegFile color="gray" size={14} />
          <div className="font-semibold text-sm text-default-700">{label}</div>
        </div>
        <p className="text-default-500 text-sm">
          {inputRef.current?.files?.[0]?.name ||
            value ||
            "Click to browse files"}
        </p>
      </div>
      <input
        className="hidden"
        ref={inputRef}
        type="file"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
      />
    </>
  );
};

export default FileInput;
