import { Switch } from "@nextui-org/react";

interface BoolInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: () => void;
  isSelected?: boolean;
}
const BoolInput = ({
  id,
  name,
  isSelected,
  label,
  onChange,
}: BoolInputProps) => {
  return (
    <Switch
      id={id}
      name={name}
      classNames={{
        wrapper:
          'group[data-selected="true"]:bg-slate-950 group-data-[selected=true]:bg-slate-950',
      }}
      size="md"
      isSelected={isSelected}
      onChange={onChange}
    >
      <p className="font-semibold">{label}</p>
    </Switch>
  );
};

export default BoolInput;
