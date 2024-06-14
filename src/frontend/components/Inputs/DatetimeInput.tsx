import { DatePicker, DateValue } from "@nextui-org/react";

interface DateInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: () => void;
  value?: DateValue;
  isRequired?: boolean;
  isDisabled?: boolean;
}
const DatetimeInput = ({
  id,
  name,
  label,
  onChange,
  value,
  isRequired,
  isDisabled,
}: DateInputProps) => {
  return (
    <DatePicker
      id={id}
      name={name}
      showMonthAndYearPickers
      hideTimeZone
      value={value}
      onChange={onChange}
      label={label}
      granularity="second"
      isRequired={isRequired}
      isDisabled={isDisabled}
    />
  );
};

export default DatetimeInput;
