"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import Modal from "../ui/modal";
import { Plus } from "lucide-react";
import { z } from "zod";
import { UserRoles } from "~/db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUser } from "~/lib/admin-helpers";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const addUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password should not be less than 6 charachters"),
  name: z.string().min(1, "User name is required"),
  role: z.enum(UserRoles),
});

type AddUserValues = z.infer<typeof addUserSchema>;

const AddUserModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleOnClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const form = useForm<AddUserValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      role: "sales-agent",
    },
  });

  const onSubmit = async (data: AddUserValues) => {
    setIsPending(true);
    try {
      const result = await createUser(data);

      if (result.success) {
        toast.success("User created successfully");
        handleOnClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" /> Add User
      </Button>
      <Modal
        title="Add new user"
        isOpen={isOpen}
        onClose={handleOnClose}
        className="min-w-2xl"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormDescription>
                    Enter the user&apos;s Fullname here
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="User's Fullname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Label>Account Security</Label>
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" {...field} />
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
                  <FormLabel>Password*</FormLabel>
                  <FormControl>
                    <Input placeholder="*******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="role"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Role*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UserRoles.map((role) => (
                        <SelectItem
                          key={role}
                          value={role}
                          className="capitalize"
                        >
                          {role.split("-").join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-4">
              <Button
                type="button"
                onClick={() => {
                  form.reset();
                  setIsOpen(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1" type="submit" disabled={isPending}>
                {isPending ? "Please wait..." : "Create user"}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>
    </div>
  );
};

export default AddUserModal;
