import { useEffect, useState } from "react";

const useDebounceValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay, setDebouncedValue]);

  return debouncedValue;
};

export default useDebounceValue;
