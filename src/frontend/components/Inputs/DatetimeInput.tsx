import { DatePicker, DateValue } from "@nextui-org/react";
import { parseDateTime } from "@internationalized/date";
import { useState } from "react";
interface DateInputProps {
  id?: string;
  name?: string;
  label: string;
  onChange: (value: DateValue) => void;
  value?: string;
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
  console.log(value);
  const [date, setDate] = useState<DateValue | undefined>(
    value || value === "" ? parseDateTime(value) : undefined
  );

  return (
    <DatePicker
      variant="bordered"
      radius="sm"
      id={id}
      name={name}
      showMonthAndYearPickers
      hideTimeZone
      value={date}
      onChange={(value) => {
        setDate(value);
        onChange(value);
      }}
      label={label}
      granularity="second"
      isRequired={isRequired}
      isDisabled={isDisabled}
      hourCycle={24}
    />
  );
};

export default DatetimeInput;
