"use client";

import { useFormContext } from "react-hook-form";
import { AdminUserValues } from "~/providers/installation-provider";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface AddAdminUserProps {
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  isPending: boolean;
  error?: {
    code?: string | undefined;
    message?: string | undefined;
    status: number;
    statusText: string;
  } | null;
}

const AddAdminUser = ({ onSubmit, isPending }: AddAdminUserProps) => {
  const form = useFormContext<AdminUserValues>();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Name<sup className="text-destructive">*</sup>
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="email"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Email<sup className="text-destructive">*</sup>
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="password"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Password<sup className="text-destructive">*</sup>
            </FormLabel>
            <FormControl>
              <Input {...field} type="password" placeholder="Enter password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isPending}>
        Proceed
      </Button>
    </form>
  );
};

export default AddAdminUser;
