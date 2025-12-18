"use client";

import {
  Archive,
  Clock,
  DollarSign,
  Kanban,
  List,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  // CardContent,
  // CardHeader,
  // CardTitle,
  // CardAction,
} from "~/components/ui/card";
import { trpc } from "~/trpc/client";
import PipelineKanban from "./pipeline-kanban";
import { toast } from "sonner";
import { useAddDealModalStore } from "~/store/use-deal-sheet-store copy";
import { useForm } from "react-hook-form";
import { AddDealValues, adddeals } from "~/validation/deals";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "~/components/ui/form";
import AddNewDealModal from "~/components/modals/add-new-deal-modal";
import { formatCurrency } from "~/lib/currency";
import Link from "next/link";
import useDebounceValue from "~/hooks/use-debounce-value";
import { Pipelines } from "~/data/pipelines";
import PipelineTable from "./pipeline-table";
import { useRouter } from "next/navigation";

const pipelineViewLayouts = [
  {
    layout: "Kanban",
    icon: Kanban,
  },
  {
    layout: "List",
    icon: List,
  },
] as const;
type PipeLineViewLayout = (typeof pipelineViewLayouts)[number]["layout"];

export default function ManagePipeline() {
  const [activeLayout, setActiveLayout] =
    useState<PipeLineViewLayout>("Kanban");

  const router = useRouter();

  const onOpenAddDealModal = useAddDealModalStore((state) => state.onOpen);
  const onCloseAddDealModal = useAddDealModalStore((state) => state.onClose);
  const [productsSearchValue, setProductSearchValue] = useState("");
  const [leadSearchValue, setLeadSearchValue] = useState("");
  const debouncedProductSearchValue = useDebounceValue(
    productsSearchValue,
    700
  );
  const debouncedLeadSearchValue = useDebounceValue(leadSearchValue, 700);

  const form = useForm<AddDealValues>({
    resolver: zodResolver(adddeals),
    defaultValues: {
      title: "",
      description: "",
      value: 0,
      currency: "USD",
      probability: 0,
      items: [],
      competitors: [],
      stakeholders: [],
    },
  });

  const utils = trpc.useUtils();

  const [pipelineStages] =
    trpc.pipelines.getPipelinesWithDeals.useSuspenseQuery({
      stage: "",
    });

  const { data: products, isLoading: isLookingupProducts } =
    trpc.products.list.useQuery({
      isActive: true,
      search: debouncedProductSearchValue,
    });

  // get items needed to create a deal
  const {
    data: leads,
    isLoading: loadingLeads,
    //error,
  } = trpc.leads.getMany.useQuery({
    status: ["qualified"],
    searchTerm: debouncedLeadSearchValue,
    page: 1,
    pageSize: 100, // Get more leads for the dropdown
  });

  const {
    data: users,
    isLoading: loadingUsers,
    //error: usersError,
  } = trpc.users.getAll.useQuery({});

  const {
    mutateAsync: addDealMutations,
    isPending,
    //error: addDealEError,
  } = trpc.deals.createDeal.useMutation();

  const {
    mutateAsync: bulkUpdate,
    //isPending: isBulkUpdating,
    //error: addDealEError,
  } = trpc.deals.bulkUpdate.useMutation({
    onSuccess: () => {
      utils.pipelines.getPipelinesWithDeals.invalidate();
      utils.leads.getMany.invalidate();
    },
  });

  const handleOnPipelineChange = async (
    data: { id: string; status: string; position: number }[]
  ) => {
    try {
      await bulkUpdate({
        deals: data,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditDeal = () => {};
  const handleDeleteDeal = () => {};

  const handleOnAddDealSubmit = async (data: AddDealValues) => {
    try {
      // some mutation here...
      await addDealMutations(data);
      toast.success("Deal created successfully");
      onCloseAddDealModal();
      form.reset();
    } catch (error) {
      console.error("Failed to create deal:", error);
    }
  };

  const pipelineSummary = useMemo(() => {
    let totalDeals = 0;
    let totalValue = 0;
    let wonDeals = 0;
    let lostDeals = 0;
    let overdueDeals = 0;
    let totalHealthScore = 0;

    const now = new Date();

    pipelineStages.forEach((stage) => {
      stage.deals.forEach((deal) => {
        totalDeals++;
        totalValue += parseFloat(deal.value) || 0;
        totalHealthScore += deal.healthScore || 0;

        // Check if deal is won (has actualCloseDate and no lostReason)
        if (deal.actualCloseDate && !deal.lostReason) {
          wonDeals++;
        }

        // Check if deal is lost (has lostReason)
        if (deal.lostReason) {
          lostDeals++;
        }

        // Check if deal is overdue (expected close date is in past)
        if (deal.expectedCloseDate) {
          const expectedDate = new Date(deal.expectedCloseDate);
          if (expectedDate < now && !deal.actualCloseDate && !deal.lostReason) {
            overdueDeals++;
          }
        }
      });
    });

    const avgHealthScore =
      totalDeals > 0 ? (totalHealthScore / totalDeals).toFixed(2) : "0";

    return {
      totalDeals,
      totalPipelineValue: totalValue,
      wonDeals,
      lostDeals,
      overdueDeals,
      avgHealth: parseFloat(avgHealthScore),
    };
  }, [pipelineStages]);

  if (!pipelineStages) {
    return <div>Stages Not Found</div>;
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-black">
              {/* {pipelineStages.length}-Stage Education Pipeline */}
              {Pipelines[0]}
            </h1>
            <p className="text-black/70">
              Manage deals through the education sales process
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/deals/archived">
                <Archive className="h-4 w-4 mr-2" /> Archives
              </Link>
            </Button>
            <Button onClick={onOpenAddDealModal}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Total Deals
                </p>
                <p className="text-base font-bold text-black">
                  {pipelineSummary.totalDeals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Pipeline Value
                </p>
                <p className="text-base font-bold text-black">
                  {formatCurrency(pipelineSummary.totalPipelineValue)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Won Deals
                </p>
                <p className="text-base font-bold text-black">
                  {pipelineSummary.wonDeals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Lost Deals
                </p>
                <p className="text-base font-bold text-black">
                  {pipelineSummary.lostDeals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Overdue
                </p>
                <p className="text-base font-bold text-black">
                  {pipelineSummary.overdueDeals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-300 bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <p className="text-xs font-medium text-black truncate">
                  Avg Health
                </p>
                <p className="text-base font-bold text-black">
                  {pipelineSummary.avgHealth}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-black" />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center h-12">
            <p className="font-semibold">{activeLayout}</p>
            <div className="flex ml-auto gap-2">
              {pipelineViewLayouts.map((layout) => (
                <Button
                  variant="outline"
                  size="icon"
                  key={layout.layout}
                  onClick={() => setActiveLayout(layout.layout)}
                >
                  {<layout.icon className="h-4 w-4" />}
                </Button>
              ))}
            </div>
          </div>
          {activeLayout === "Kanban" && (
            <PipelineKanban
              onChange={handleOnPipelineChange}
              onEditDeal={handleEditDeal}
              onDeleteDeal={handleDeleteDeal}
              pipelineStages={pipelineStages}
            />
          )}
          {activeLayout === "List" && (
            <Card>
              <PipelineTable
                pipelineStages={pipelineStages}
                onView={(deal) => router.push(`/deals/${deal.id}`)}
              />
            </Card>
          )}

          <Form {...form}>
            <AddNewDealModal
              onClose={() => {
                form.reset();
                onCloseAddDealModal();
              }}
              searchValue={productsSearchValue}
              handleSearchProduct={setProductSearchValue}
              onSubmit={handleOnAddDealSubmit}
              isPending={isPending}
              leads={leads?.items || []}
              users={users || []}
              products={products || []}
              leadSearchValue={leadSearchValue}
              handleSearchLead={setLeadSearchValue}
              stages={(pipelineStages || []).map((stage) => ({
                id: stage.id,
                name: stage.name,
                stageProbability: stage.stageProbability,
              }))}
              isLoading={loadingLeads || loadingUsers || isLookingupProducts}
            />
          </Form>
        </div>
      </div>
    </div>
  );
}
