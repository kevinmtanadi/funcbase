import { FaRegCalendar, FaRegFile } from "react-icons/fa";
import { HiOutlineHashtag } from "react-icons/hi";
import { RiText } from "react-icons/ri";
import { RxComponentBoolean } from "react-icons/rx";
import { TbCirclesRelation } from "react-icons/tb";

export const datatypes = [
  {
    label: "Relation",
    value: "relation",
    dtype: "RELATION",
    icon: <TbCirclesRelation />,
  },
  {
    label: "Plain text",
    value: "text",
    dtype: "TEXT",
    icon: <RiText />,
  },
  {
    label: "Number",
    value: "number",
    dtype: "REAL",
    icon: <HiOutlineHashtag />,
  },
  {
    label: "Boolean",
    value: "boolean",
    dtype: "BOOLEAN",
    icon: <RxComponentBoolean />,
  },
  {
    label: "Datetime",
    value: "datetime",
    dtype: "DATETIME",
    icon: <FaRegCalendar />,
  },
  {
    label: "File",
    value: "file",
    dtype: "FILE",
    icon: <FaRegFile />,
  },
];
