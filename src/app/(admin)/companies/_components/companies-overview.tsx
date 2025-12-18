"use client";

import { useState } from "react";
import PageHeader from "~/components/page-header";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { CompanyDetailModal } from "~/components/modals/view-company-modal";
import { AddCompanyModal } from "~/components/modals/add-company-modal";
import { useAddCompanyModalStore } from "~/store/use-add-company-modal-store";
import {
  Building2,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function CompaniesOverview() {
  const {
    isOpen: isAddCompanyModalOpen,
    companyId: editCompanyId,
    onOpen: openAddCompanyModal,
    onClose: closeAddCompanyModal,
  } = useAddCompanyModalStore();
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleOnOpenViewModal = (id: string) => {
    setSelectedCompanyId(id);
    setViewModalOpen(true);
  };

  const handleOnCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedCompanyId(null);
  };

  const { data: companiesData, isLoading } = trpc.companies.list.useQuery({
    search: searchQuery || undefined,
    industry: industryFilter || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const { data: stats } = trpc.companies.getStatistics.useQuery();

  const companies = companiesData?.companies ?? [];
  const totalCount = companiesData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleIndustryChange = (value: string) => {
    setIndustryFilter(value);
    setCurrentPage(1);
  };

  const handleOnOpenEditModal = (id: string) => {
    openAddCompanyModal(id);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Companies"
        subtitle="Manage your company database"
        actions={
          <Button onClick={() => openAddCompanyModal()}>
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              {stats?.totalCompanies ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all industries
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              $
              {(stats?.totalRevenue ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Industries
            </CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              {stats?.totalIndustries ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Different sectors
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  overflow-hidden">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">
              $
              {stats?.totalCompanies && stats.totalCompanies > 0
                ? (stats.totalRevenue / stats.totalCompanies).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2 }
                  )
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per company</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none ">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies by name or website..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={industryFilter} onValueChange={handleIndustryChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="border-none ">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Deals</TableHead>
              <TableHead>Quotes</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  Loading companies...
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No companies found</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add your first company
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  //   onClick={() => setSelectedCompanyId(company.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{company.name}</p>
                        {company.website && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {new URL(company.website).hostname}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.industry ? (
                      <Badge variant="secondary">{company.industry}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {company.city && company.country ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {company.city}, {company.country}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {company._count.contacts}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {company._count.deals}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {company._count.quotes}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-semibold text-green-600">
                        $
                        {company.totalRevenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {company._count.invoices} invoices
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="flex gap-x-2">
                    <Button
                      variant="ghost"
                      type="button"
                      size="sm"
                      onClick={() => {
                        handleOnOpenViewModal(company.id);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => {
                        handleOnOpenEditModal(company.id);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <Card className="border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                companies
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">{currentPage}</span>
                    <span className="text-sm text-muted-foreground">of</span>
                    <span className="text-sm font-medium">{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CompanyDetailModal
        isOpen={isViewModalOpen}
        onClose={handleOnCloseViewModal}
        companyId={selectedCompanyId}
      />

      <AddCompanyModal
        open={isAddCompanyModalOpen}
        onClose={closeAddCompanyModal}
        companyId={editCompanyId}
      />
    </div>
  );
}
