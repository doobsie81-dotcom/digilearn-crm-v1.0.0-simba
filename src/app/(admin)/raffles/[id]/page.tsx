"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Loader2, Trophy, Mail, Phone, Building2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function RaffleViewPage() {
  const params = useParams();
  const raffleId = params.id as string;

  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<{ ticketNumber: number; leadName: string } | null>(null);
  const [currentTicket, setCurrentTicket] = useState<number>(0);

  const { data: raffle, isLoading: raffleLoading } = trpc.raffle.getById.useQuery(
    { id: raffleId },
    { enabled: !!raffleId }
  );

  const { data: entries, isLoading: entriesLoading } = trpc.raffle.getEntries.useQuery(
    { id: raffleId },
    { enabled: !!raffleId }
  );

  const formatTicketNumber = (num: number) => {
    return `DL-${num.toString().padStart(4, "0")}`;
  };

  const pickWinner = () => {
    if (!entries || entries.length === 0) {
      toast.error("No entries to pick from!");
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Slot machine effect - cycle through tickets rapidly
    let count = 0;
    const maxSpins = 50; // Number of spins before slowing down
    let speed = 50; // Initial speed in ms

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * entries.length);
      const entry = entries[randomIndex];
      setCurrentTicket(entry!.ticketNumber);

      count++;

      // Slow down gradually
      if (count > maxSpins * 0.6) {
        speed += 20;
      }

      if (count >= maxSpins) {
        clearInterval(interval);

        // Pick final winner after a brief pause
        setTimeout(() => {
          const winnerIndex = Math.floor(Math.random() * entries.length);
          const winningEntry = entries[winnerIndex]!;

          setWinner({
            ticketNumber: winningEntry.ticketNumber,
            leadName: winningEntry.lead.company.name,
          });
          setCurrentTicket(winningEntry.ticketNumber);
          setIsSpinning(false);

          toast.success(
            `🎉 Winner: ${winningEntry.lead.company.name} - ${formatTicketNumber(winningEntry.ticketNumber)}`
          );
        }, 500);
      }
    }, speed);
  };

  if (raffleLoading || entriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Raffle Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The raffle you&apos;re looking for doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = new Date() >= raffle.startDate && new Date() <= raffle.endDate;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {raffle.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {raffle.location && `${raffle.location} • `}
            {format(raffle.startDate, "PPP")} - {format(raffle.endDate, "PPP")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <Badge className="bg-green-500">Active</Badge>
          ) : new Date() < raffle.startDate ? (
            <Badge variant="secondary">Upcoming</Badge>
          ) : (
            <Badge variant="outline">Ended</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{raffle.totalEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Start Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(raffle.startDate, "MMM d")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(raffle.startDate, "yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">End Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(raffle.endDate, "MMM d")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(raffle.endDate, "yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Slot Machine / Winner Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Pick a Winner
          </CardTitle>
          <CardDescription>
            Click the button below to randomly select a winner from all entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slot Display */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl shadow-2xl">
              <div className="bg-white dark:bg-gray-900 px-12 py-8 rounded-xl min-w-[300px]">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  {isSpinning ? "SPINNING..." : winner ? "WINNER!" : "READY"}
                </p>
                <p className="text-center text-5xl font-bold tracking-wider">
                  {currentTicket > 0
                    ? formatTicketNumber(currentTicket)
                    : "----"}
                </p>
                {winner && (
                  <p className="text-center mt-4 text-lg font-semibold text-green-600 dark:text-green-400">
                    {winner.leadName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={pickWinner}
              disabled={isSpinning || !entries || entries.length === 0}
              className="text-lg px-8 py-6"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-5 w-5" />
                  Pick Winner
                </>
              )}
            </Button>
          </div>

          {winner && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground">
                Congratulations to the winner! Make sure to contact them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
          <CardDescription>
            Complete list of all raffle participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No entries yet</p>
              <p className="text-muted-foreground">
                Share the raffle link to get participants
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Entry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono font-semibold">
                        {formatTicketNumber(entry.ticketNumber)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <Link
                            href={`/leads/${entry.lead.id}`}
                            className="hover:underline font-medium"
                          >
                            {entry.lead.company.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.lead.primaryContact.firstName}{" "}
                        {entry.lead.primaryContact.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${entry.lead.primaryContact.email}`}
                            className="hover:underline"
                          >
                            {entry.lead.primaryContact.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.lead.primaryContact.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${entry.lead.primaryContact.phoneNumber}`}
                              className="hover:underline"
                            >
                              {entry.lead.primaryContact.phoneNumber}
                            </a>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(entry.entryDate, "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
