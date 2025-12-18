"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { useCallback, useEffect, useState } from "react";
import CompactDealCard from "~/components/compact-deal-card";
import { Company, Deal, PipelineStage } from "~/db/types";
import { KanbanHeader } from "./kanban-header";

interface KanbanColumnProps {
  onChange: (deals: { id: string; position: number; status: string }[]) => void;
  onEditDeal?: (deal: Deal) => void;
  onDeleteDeal?: (dealId: string) => void;
  pipelineStages: (PipelineStage & { deals: Deal[] })[];
}

type PipelineState = Record<string, (Deal & { company: Company })[]>;

export default function PipelineKanban({
  onChange,
  onEditDeal,
  onDeleteDeal,
  pipelineStages,
}: KanbanColumnProps) {
  // we need a copy here.
  const [pipelines, setPipelines] = useState(() => {
    const sorted = pipelineStages.sort((a, b) => a.order - b.order);
    // now we create this
    const initialPipeline = Object.fromEntries(
      sorted.map(({ name, deals }) => [
        name,
        deals.sort((a, b) => a.position - b.position),
      ])
    ) as PipelineState;

    return initialPipeline;
  });

  useEffect(() => {
    const sorted = pipelineStages.sort((a, b) => a.order - b.order);
    // now we create this
    const newPipeline = Object.fromEntries(
      sorted.map(({ name, deals }) => [
        name,
        deals.sort((a, b) => a.position - b.position),
      ])
    ) as PipelineState;
    setPipelines(newPipeline);
  }, [pipelineStages]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      // if ((onDragEnd as any)._handling) return;
      // (onDragEnd as any)._handling = true;

      const { source, destination } = result;
      const sourceStatus = source.droppableId as string;
      const destStatus = destination.droppableId as string;

      const updatesPayload: { id: string; status: string; position: number }[] =
        [];

      setPipelines((prevPipeline) => {
        const newDeals = { ...prevPipeline };

        const sourceColumn = [...newDeals[sourceStatus]];
        const [movedDeal] = sourceColumn.splice(source.index, 1);
        if (!movedDeal) {
          console.error("No deal found at the source index");
          return prevPipeline;
        }

        const updatedMovedDeal =
          sourceStatus !== destStatus
            ? { ...movedDeal, status: destStatus }
            : movedDeal;

        // update source column
        newDeals[sourceStatus] = sourceColumn;

        // add the deal to the new destination column
        const destColumn = [...newDeals[destStatus]];
        destColumn.splice(destination.index, 0, updatedMovedDeal);
        newDeals[destStatus] = destColumn;

        console.log("Pushed");
        // always payload
        updatesPayload.push({
          id: updatedMovedDeal.id,
          status: destStatus,
          position: Math.min((destination.index + 1) * 1000, 1_000_000),
        });

        //  Update positions for affected deals in the destination column
        newDeals[destStatus].forEach((deal, index) => {
          if (deal && deal.id !== updatedMovedDeal.id) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (deal.position !== newPosition) {
              updatesPayload.push({
                id: deal.id,
                status: destStatus,
                position: newPosition,
              });
            }
          }
        });

        if (sourceStatus !== destStatus) {
          newDeals[sourceStatus].forEach((deal, index) => {
            if (deal) {
              const newPosition = Math.min((index + 1) * 1000, 1_000_000);
              if (deal.position !== newPosition) {
                updatesPayload.push({
                  id: deal.id,
                  status: sourceStatus,
                  position: newPosition,
                });
              }
            }
          });
        }

        return newDeals;
      });

      onChange(updatesPayload);
    },
    [onChange]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto min-h-200">
        <div
          className="flex gap-2 min-h-[600px] pb-4"
          style={{ width: "max-content" }}
        >
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="min-w-[200px]">
              <div className="flex flex-col h-full bg-white border border-input rounded-md">
                <KanbanHeader
                  deals={pipelines[stage.name]}
                  stage={{
                    name: stage.name,
                    description: stage.description,
                    color: stage.color,
                  }}
                />
                <Droppable droppableId={stage.name}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-1.5 space-y-1.5 overflow-y-auto min-h-0 transition-colors ${
                        snapshot.isDraggingOver ? "bg-blue-50" : ""
                      }`}
                    >
                      {pipelines[stage.name].map((deal, index) => (
                        <Draggable
                          key={String(deal.id)}
                          draggableId={String(deal.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="min-w-[200px]"
                            >
                              <CompactDealCard
                                deal={deal}
                                stage={stage}
                                onEdit={onEditDeal}
                                onDelete={onDeleteDeal}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {pipelines[stage.name].length === 0 && (
                        <div className="text-center py-4 text-black/70">
                          <p className="text-xs">No deals</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
