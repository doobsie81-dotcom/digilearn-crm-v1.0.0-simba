import { Deal } from "~/db/types"

export type PipelineState = Record<string, Deal[]>

export interface ReorderArgs {
  dealId: string
  fromStageId: string
  toStageId: string
  toIndex: number
  stageProbability: number;
}

export interface ReorderResult {
  nextState: PipelineState
  moved: Deal | null
}

function clampIndex(index: number, length: number) {
  if (Number.isNaN(index)) return length
  return Math.min(Math.max(index, 0), Math.max(length, 0))
}


function normaliseStage(stageId: string, deals: Deal[]): Deal[] {
  return deals.map((deal, position) => ({
    ...deal,
    stage: stageId,
    position,
  }))
}

/**
 * Immutably reorders deals across pipeline stages.
 * Returns the next state and the moved deal (or null when no move occurred).
 */
export function reorderDeals(state: PipelineState, args: ReorderArgs): ReorderResult {
  const { dealId, fromStageId, toStageId, stageProbability } = args
  const targetIndex = clampIndex(args.toIndex, (state[toStageId] ?? []).length)

  const sourceDeals = [...(state[fromStageId] ?? [])]
  const dealPosition = sourceDeals.findIndex(deal => String(deal.id) === String(dealId))

  if (dealPosition === -1) {
    return { nextState: state, moved: null }
  }

  const [dealToMove] = sourceDeals.splice(dealPosition, 1)

  const destinationDeals = fromStageId === toStageId ? sourceDeals : [...(state[toStageId] ?? [])]

  const updatedDeal: Deal = {
    ...dealToMove,
    currentStatus: toStageId,
    currentStageSince: new Date(),
    probability: stageProbability ?? dealToMove.probability,
  };

  destinationDeals.splice(targetIndex, 0, updatedDeal)

  const nextState: PipelineState = {
    ...state,
    [fromStageId]: normaliseStage(fromStageId, sourceDeals),
    [toStageId]: normaliseStage(toStageId, destinationDeals),
  }

  const moved = nextState[toStageId]?.find(deal => String(deal.id) === String(dealId)) ?? null

  return { nextState, moved }
}
