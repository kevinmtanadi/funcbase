import { Divider } from "@nextui-org/react";
import classNames from "classnames";
import React from "react";
import { FaAngleDown } from "react-icons/fa6";

interface CustomAutocompleteProps {
  id?: string;
  name?: string;
  options?: any[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

const CustomAutocomplete = ({
  id,
  name,
  options,
  value,
  onChange,
  label,
}: CustomAutocompleteProps) => {
  const [isExpand, setIsExpand] = React.useState(false);

  return (
    <>
      <div className="flex flex-col border-2 rounded-md p-2">
        {label && <label className="text-sm font-semibold">{label}</label>}
        <div className="flex">
          <input
            id={id}
            name={name}
            className="text-sm w-full"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <div
            onClick={() => setIsExpand(!isExpand)}
            className="w-[20px] flex justify-center items-center cursor-pointer"
          >
            <FaAngleDown
              className={classNames({
                "rotate-180": isExpand,
                "rotate-0": !isExpand,
                "transition-all": true,
              })}
              size={12}
            />
          </div>
        </div>
        <div className="">
          {isExpand && <Divider className="my-1" />}
          <div
            className={classNames({
              "w-full bg-white transition-all overflow-y-scroll flex flex-col":
                true,
              "h-0 opacity-0": !isExpand,
              "h-[60px] min-h-[60px] max-h-[60px] opacity-100": isExpand,
            })}
          >
            {options &&
              options.length > 0 &&
              options.map((option: any) => (
                <div
                  key={option.id}
                  className={classNames({
                    "flex items-center cursor-pointer hover:bg-default-100 py-[2px]":
                      true,
                    "bg-slate-300": option.id === value,
                  })}
                  onClick={() => {
                    onChange?.(option.id);
                    setIsExpand(false);
                  }}
                >
                  <div className="text-sm">{option.id}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomAutocomplete;
