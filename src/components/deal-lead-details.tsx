"use client";

import { UserCheck2 } from "lucide-react";
import { Lead, Company, Contact } from "~/db/types";
import { formatCurrency } from "~/lib/currency";

interface DealLeadProps {
  lead: Lead & { primaryContact: Contact };
  company: Company;
  value: string;
}

const DealLead: React.FC<DealLeadProps> = ({ lead, company, value }) => {
  return (
    <div>

      <div className="flex items-end">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">{company.name}</p>
          <p className="text-sm text-gray-700">{lead.name}</p>
        </div>
        <div className="ml-auto text-2xl font-bold">
          {formatCurrency(parseFloat(value), "USD")}
        </div>
      </div>
      <div className=" bg-muted flex items-center px-1.5 mt-4">
        <UserCheck2 className="h-6 w-6 mr-2" />
        <div>
          <p className="font-medium text-sm">Primary Contact</p>
          <p className="text-sm">
            {lead?.primaryContact.firstName} {lead?.primaryContact.lastName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealLead;
