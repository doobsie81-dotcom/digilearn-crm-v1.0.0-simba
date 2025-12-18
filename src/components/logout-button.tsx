"use client";

import { signOut, useSession } from "~/lib/auth-client";
import { Button, type buttonVariants } from "./ui/button";

import type { VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

const LogoutButton: React.FC<
  {
    className?: string;
    buttonText?: string;
    showIcon?: boolean;
  } & VariantProps<typeof buttonVariants>
> = ({ variant, className, showIcon = false, buttonText = "Logout" }) => {
  const router = useRouter();
  const { refetch } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onError: (ctx) => {
            console.error("Logout error:", ctx.error);
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success("Logged out successfully");
          },
        },
      });
    } catch (error) {
      console.error("Unexpected logout error:", error);
    } finally {
      // Always clear client state and redirect, even if signOut fails
      // This ensures the user is logged out on the client side
      refetch();
      router.refresh();
      router.push("/auth/login");
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleLogout}
      // {...props}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {buttonText}
    </Button>
  );
};

export default LogoutButton;
