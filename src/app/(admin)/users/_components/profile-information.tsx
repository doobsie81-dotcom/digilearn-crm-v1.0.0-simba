"use client";

import { trpc } from "~/trpc/client";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Mail, Camera } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export default function ProfileInformation({ id }: { id: string }) {
  const [user] = trpc.users.getById.useSuspenseQuery({ id });

  return (
    <Card className="md:col-span-1">
      <CardHeader className="text-center pb-4">
        <div className="relative mx-auto mb-4">
          <Avatar className="h-20 w-20">
            {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
            <AvatarFallback className="text-lg">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-xl">{user.name}</CardTitle>
        <CardDescription>{user.role}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{user.email}</span>
        </div>
        <Badge variant="secondary" className="mt-2">
          Joined: {new Date(user.createdAt).getFullYear()}
        </Badge>
      </CardContent>
    </Card>
  );
}
