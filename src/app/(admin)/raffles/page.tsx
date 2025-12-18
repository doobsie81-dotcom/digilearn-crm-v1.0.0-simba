"use client";

import { useState } from "react";
import { Plus, Trophy, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { trpc } from "~/trpc/client";
import { AddRaffleDialog } from "./_components/add-raffle-dialog";
import Link from "next/link";

export default function RafflesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: raffles, isLoading } = trpc.raffle.list.useQuery({});

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raffles</h1>
          <p className="text-muted-foreground mt-1">
            Manage raffle events and track entries
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Raffle
        </Button>
      </div>

      {/* Raffle List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : raffles && raffles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {raffles.map((raffle) => (
            <Link key={raffle.id} href={`/raffles/${raffle.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{raffle.title}</CardTitle>
                    </div>
                    {raffle.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : new Date() < raffle.startDate ? (
                      <Badge variant="secondary">Upcoming</Badge>
                    ) : (
                      <Badge variant="outline">Ended</Badge>
                    )}
                  </div>
                  {raffle.location && (
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3" />
                      {raffle.location}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(raffle.startDate, "MMM d")} -{" "}
                      {format(raffle.endDate, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{raffle.totalEntries}</span>
                    <span className="text-muted-foreground">
                      {raffle.totalEntries === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No raffles yet</h3>
                <p className="text-muted-foreground text-sm">
                  Create your first raffle to get started
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Raffle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Raffle Dialog */}
      <AddRaffleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
