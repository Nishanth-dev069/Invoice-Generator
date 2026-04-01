/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  sortableKeyboardCoordinates 
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PHASES = ["RAW_MATERIALS", "DESIGN", "PRINTING", "POST_PRINTING", "PAYMENT_PENDING"];

export function KanbanBoard({ 
  initialData, 
  isAdmin 
}: { 
  initialData: Record<string, any[]>;
  isAdmin: boolean;
}) {
  const [columns, setColumns] = useState<Record<string, any[]>>(initialData);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  
  const queryClient = useQueryClient();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      // Press and hold 250ms before drag starts so normal touch scroll still works
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveMutation = useMutation({
    mutationFn: async ({ id, phase, order }: { id: string, phase: string, order: number }) => {
      const res = await fetch(`/api/wip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, order }),
      });
      if (!res.ok) throw new Error("Failed to move card");
    },
    onError: () => {
      toast.error("Failed to save card position.");
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wip/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete card");
    },
    onSuccess: () => {
      toast.success("Card removed.");
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const finalCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/final-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wipCardId: id }),
      });
      if (!res.ok) throw new Error("Failed to transfer to final check");
    },
    onSuccess: () => {
      toast.success("Card moved to Final Check.");
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    
    // Find active card
    let activeItem;
    for (const phase of PHASES) {
      activeItem = columns[phase].find(card => card.id === id);
      if (activeItem) break;
    }
    setActiveCard(activeItem || null);
  };

  const findContainer = (id: string, items: Record<string, any[]>) => {
    if (id in items) return id;
    return Object.keys(items).find((key) => items[key].some((item) => item.id === id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    setColumns((prev) => {
      const activeContainer = findContainer(activeId as string, prev);
      const overContainer = findContainer(overId as string, prev);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }

      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      const overIndex = overItems.findIndex(t => t.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      const [item] = activeItems.splice(activeIndex, 1);
      item.phase = overContainer; // update local phase
      overItems.splice(newIndex, 0, item);

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId as string, columns);
    const overContainer = findContainer(overId as string, columns);

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = columns[activeContainer].findIndex(t => t.id === activeId);
      const overIndex = columns[overContainer].findIndex(t => t.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    }

    setActiveCard(null);

    // Save persistence debounced
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      // Find the card's new phase and order
      let finalPhase = "";
      let finalOrder = 0;
      let cardFound = false;
      
      for (const phase of PHASES) {
        setColumns(currentCols => {
          const idx = currentCols[phase].findIndex(c => c.id === activeId);
          if (idx !== -1) {
            finalPhase = phase;
            finalOrder = idx;
            cardFound = true;
          }
          return currentCols;
        });
        if (cardFound) break;
      }

      if (cardFound) {
        moveMutation.mutate({ id: activeId as string, phase: finalPhase, order: finalOrder });
      }
    }, 500);
  };

  const confirmDelete = (id: string) => {
    if (confirm("Remove from board? Invoice will not be deleted.")) {
      deleteMutation.mutate(id);
    }
  };

  const confirmMarkComplete = (id: string) => {
    if (confirm("Move to Final Check?")) {
      finalCheckMutation.mutate(id);
    }
  };

  const markPaymentPending = (id: string, currentPhase: string) => {
    moveMutation.mutate({ id, phase: "PAYMENT_PENDING", order: 0 });
    // Optimistically update local state to reflect the transition visually immediately
    setColumns((prev) => {
      const activeItems = [...prev[currentPhase]];
      const itemIndex = activeItems.findIndex((c) => c.id === id);
      if (itemIndex > -1) {
        const [item] = activeItems.splice(itemIndex, 1);
        item.phase = "PAYMENT_PENDING";
        const newOverItems = [item, ...(prev["PAYMENT_PENDING"] || [])];
        return {
          ...prev,
          [currentPhase]: activeItems,
          ["PAYMENT_PENDING"]: newOverItems,
        };
      }
      return prev;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[500px] snap-x pt-2">
        {PHASES.map((phase) => (
          <div key={phase} className="snap-center h-full">
            <KanbanColumn 
              id={phase} 
              cards={columns[phase] || []} 
              isAdmin={isAdmin}
              onDelete={confirmDelete}
              onMarkComplete={confirmMarkComplete}
              onMarkPaymentPending={(id: string) => markPaymentPending(id, phase)}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCard 
            card={activeCard} 
            isAdmin={isAdmin}
            onDelete={() => {}}
            onMarkComplete={() => {}}
            onMarkPaymentPending={() => {}}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
