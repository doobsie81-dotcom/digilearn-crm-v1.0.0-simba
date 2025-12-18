"use client";

import { forwardRef } from "react";
import PhoneInput, { PhoneInputProps } from "react-phone-input-2";

import "react-phone-input-2/lib/style.css";

const PhoneNumberInput: React.FC<PhoneInputProps> = forwardRef(
  ({ country = "zw", placeholder = "Enter phone number", ...field }) => {
    return (
      <PhoneInput
        enableSearch
        containerClass="flex flex-row-reverse w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors"
        inputClass="!border-none flex !h-9 !w-auto flex-1 bg-transparent placeholder:text-muted-foreground !px-3 !pr-0 py-1 focus-visible:ring-ring focus-visible:outline-none"
        inputProps={{
          placeholder,
        }}
        buttonClass="!relative !border-none"
        country={country}
        {...field}
      />
    );
  }
);

PhoneNumberInput.displayName = "PhoneNumberInput";

export default PhoneNumberInput;
