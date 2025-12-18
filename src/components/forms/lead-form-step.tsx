"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { LeadInfoValues } from "../modals/add-lead-form";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { leadSourceEnum } from "~/db/schema";
import { Button } from "../ui/button";
import { Company, Contact } from "~/db/types";
import { useMemo } from "react";
import { PROVINCES, REGIONS } from "~/data/provinces";
import { useSession } from "~/lib/auth-client";
import { trpc } from "~/trpc/client";

const LeadFormStep = ({
  onSubmit,
  handleClose,
  companies,
  setCompanySearchTerm,
}: {
  onSubmit: (data: LeadInfoValues) => void;
  handleClose: () => void;
  companies: (Company & { persons: Contact[] })[];
  setCompanySearchTerm: (term: string) => void;
}) => {
  const form = useFormContext<LeadInfoValues>();
  const companyName = form.watch("companyName");
  const companyId = form.watch("companyId");
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role;

  // Check if user can assign leads (admin or sales-manager)
  const canAssignLeads =
    currentUserRole === "admin" || currentUserRole === "sales-manager";

  // Fetch sales agents if user can assign leads
  const { data: salesAgents, isLoading: isLoadingSalesAgents } =
    trpc.users.getByRole.useQuery(
      { roles: ["sales-agent"] },
      { enabled: canAssignLeads }
    );

  const filteredCompanies = useMemo(() => {
    // Don't show suggestions if no search query or if a company is already selected
    if (!companyName || companyId) return [];

    // Filter companies by search query and exclude the selected one
    return companies.filter((company) => {
      const matchesSearch = company.name
        .toLowerCase()
        .includes(companyName.toLowerCase());
      const isNotSelected = company.id !== companyId;
      return matchesSearch && isNotSelected;
    });
  }, [companyName, companyId, companies]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name *</FormLabel>
            <FormControl>
              <Input
                placeholder="Search or type company name..."
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  setCompanySearchTerm(e.target.value);
                  // Clear the companyId when user types to allow new search
                  if (companyId) {
                    form.setValue("companyId", undefined);
                  }
                }}
              />
            </FormControl>
            {/* Show suggestions only when searching and no company is selected */}
            {filteredCompanies.length > 0 && (
              <div className="space-y-2 w-full border border-input rounded-md p-2.5 max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">
                  Select an existing company:
                </p>
                {filteredCompanies.map((company) => (
                  <Button
                    key={company.id}
                    type="button"
                    className="w-full justify-start capitalize"
                    variant="secondary"
                    onClick={() => {
                      form.setValue("companyId", company.id);
                      form.setValue("companyName", company.name);
                    }}
                  >
                    {company.name}
                  </Button>
                ))}
              </div>
            )}
            {companyId && (
              <p className="text-xs text-muted-foreground">
                Company selected. Clear the field to search for a different
                company.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lead Requirement*</FormLabel>
            <FormControl>
              <Input placeholder="Supply of Stationery" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City*</FormLabel>
            <FormControl>
              <Input placeholder="Chivhu" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="province"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Province *</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem
                    key={province}
                    value={province}
                    className="capitalize"
                  >
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Region *</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem
                    key={region}
                    value={region}
                    className="capitalize"
                  >
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lead Source *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {leadSourceEnum.map((source) => (
                  <SelectItem
                    key={source}
                    value={source}
                    className="capitalize"
                  >
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="estimatedValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estimated Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Show assign-to field only for admin and sales-manager */}
      {canAssignLeads && (
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To (Optional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign to sales agent (leave empty for unassigned)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="self">Assign to myself</SelectItem>
                  {isLoadingSalesAgents ? (
                    <SelectItem value="loading" disabled>
                      Loading agents...
                    </SelectItem>
                  ) : (
                    salesAgents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave empty to create an unassigned lead
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
};

export default LeadFormStep;
