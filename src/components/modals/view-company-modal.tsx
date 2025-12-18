"use client";

import { trpc } from "~/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Mail,
  Phone,
  Briefcase,
  Star,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { QuoteStatusBadge } from "~/components/quote-status-badge";
import Modal from "../ui/modal";

interface CompanyDetailModalProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyDetailModal({
  companyId,
  isOpen,
  onClose,
}: CompanyDetailModalProps) {
  const { data, isLoading } = trpc.companies.getById.useQuery(
    { id: companyId ?? "" },
    { enabled: isOpen && !!companyId }
  );

  if (!isOpen) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            {data?.company.name}
            {data?.company.website && (
              <a
                href={data?.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      className="w-full min-w-7xl"
    >
      {isLoading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : data ? (
        <div>
          {/* left */}
          <div className="p-6 pb-4 space-y-4">
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {data.company.industry && (
                <Badge variant="secondary">{data.company.industry}</Badge>
              )}
              {data.company.city && data.company.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.company.city}, {data.company.country}
                </div>
              )}
              {data.company.website && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <a
                    href={data.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold">
                        ${data.stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Deals</p>
                      <p className="text-lg font-bold">
                        {data.stats.totalDeals}
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Quotes</p>
                      <p className="text-lg font-bold">
                        {data.stats.totalQuotes}
                      </p>
                    </div>
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Contacts</p>
                      <p className="text-lg font-bold">
                        {data.stats.totalContacts}
                      </p>
                    </div>
                    <Users className="h-4 w-4 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* <Separator /> */}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contacts">
                  Contacts ({data.contacts.length})
                </TabsTrigger>
                <TabsTrigger value="leads">
                  Leads ({data.leads.length})
                </TabsTrigger>
                <TabsTrigger value="deals">
                  Deals ({data.deals.length})
                </TabsTrigger>
                <TabsTrigger value="quotes">
                  Quotes ({data.quotes.length})
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  Invoices ({data.invoices.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[500px] px-6 pb-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {data.company.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {data.company.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Company Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.company.industry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Industry
                          </span>
                          <span className="font-medium">
                            {data.company.industry}
                          </span>
                        </div>
                      )}
                      {data.company.employeeCount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Employees
                          </span>
                          <span className="font-medium">
                            {data.company.employeeCount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {data.company.annualRevenue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Annual Revenue
                          </span>
                          <span className="font-medium">
                            $
                            {parseFloat(
                              data.company.annualRevenue
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Added</span>
                        <span className="font-medium">
                          {format(
                            new Date(data.company.createdAt),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        {data.company.addressLine1 && (
                          <p>{data.company.addressLine1}</p>
                        )}
                        {data.company.addressLine2 && (
                          <p>{data.company.addressLine2}</p>
                        )}
                        {(data.company.city || data.company.province) && (
                          <p>
                            {data.company.city}
                            {data.company.city && data.company.province && ", "}
                            {data.company.province} {data.company.region}
                          </p>
                        )}
                        {data.company.country && <p>{data.company.country}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Contacts Tab */}
              <TabsContent value="contacts" className="space-y-3 mt-4">
                {data.contacts.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No contacts yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.contacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-2">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                {contact.leadAssociations?.some(
                                  (lc) => lc.isPrimary
                                ) && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              {contact.email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <Mail className="h-3 w-3" />
                                  {contact.email}
                                </div>
                              )}
                              {contact.phoneNumber && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {contact.phoneNumber}
                                </div>
                              )}
                              {contact.leadAssociations &&
                                contact.leadAssociations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {contact.leadAssociations
                                      .filter((lc) => !lc.isPrimary)
                                      .map((lc) => (
                                        <Badge
                                          key={lc.leadId}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <Briefcase className="h-3 w-3 mr-1" />
                                          {lc.role || "Contact"}
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Leads Tab */}
              <TabsContent value="leads" className="space-y-3 mt-4">
                {data.leads.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No leads yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.leads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{lead.name}</p>

                            <div className="flex items-center gap-2 mt-2">
                              <Badge>{lead.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {lead.createdAt &&
                                  format(
                                    new Date(lead.createdAt),
                                    "MMM dd, yyyy"
                                  )}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Deals Tab */}
              <TabsContent value="deals" className="space-y-3 mt-4">
                {data.deals.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No deals yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.deals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{deal.title}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge>{deal.currentStatus}</Badge>
                              <span className="text-lg font-bold text-green-600">
                                ${parseFloat(deal.value).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(deal.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Quotes Tab */}
              <TabsContent value="quotes" className="space-y-3 mt-4">
                {data.quotes.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No quotes yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.quotes.map((quote) => (
                    <Card
                      key={quote.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{quote.quoteNumber}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <QuoteStatusBadge status={quote.status} />
                              <span className="text-lg font-bold">
                                ${parseFloat(quote.total).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(
                                new Date(quote.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="space-y-3 mt-4">
                {data.invoices.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No invoices yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.invoices.map((invoice) => (
                    <Card
                      key={invoice.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">
                              {invoice.invoiceNumber}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge
                                variant={
                                  invoice.paymentStatus === "Paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {invoice.paymentStatus}
                              </Badge>
                              <span className="text-lg font-bold">
                                ${parseFloat(invoice.total).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Due:{" "}
                              {invoice.dueDate &&
                                format(
                                  new Date(invoice.dueDate),
                                  "MMM dd, yyyy"
                                )}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Company not found</p>
        </div>
      )}
    </Modal>
  );
}
