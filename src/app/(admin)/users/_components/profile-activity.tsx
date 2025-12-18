"use client";

import { trpc } from "~/trpc/client";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
// import { Button } from "~/components/ui/button";
// import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { 
  // Mail, Camera, 
  Target, TrendingUp, Award, Clock } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useState } from "react";

const TABS_LIST = ["Activity", "Tasks", "Deals", "Leads", "Security"] as const;
type ProfileTab = (typeof TABS_LIST)[number];

const stats = [
  { label: "Deals Closed", value: "47", change: "+12%", icon: Target },
  {
    label: "Revenue Generated",
    value: "$892K",
    change: "+18%",
    icon: TrendingUp,
  },
  { label: "Avg Deal Size", value: "$18.9K", change: "+5%", icon: Award },
  { label: "Response Time", value: "2.4h", change: "-15%", icon: Clock },
];

export default function ProfileActivity({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Activity");
  const [user] = trpc.users.getById.useSuspenseQuery({ id });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Your key metrics for the current quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <Badge
                      variant={
                        stat.change.startsWith("+") ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-1">
        <CardContent className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ProfileTab)}
          >
            <TabsList>
              {TABS_LIST.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="Activity">
              <div>{JSON.stringify(user, null, 2)}</div>
            </TabsContent>
            <TabsContent value="Tasks">Tasks</TabsContent>
            <TabsContent value="Deals">Deals</TabsContent>
            <TabsContent value="Leads">Leads</TabsContent>
            <TabsContent value="Security">Security</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
