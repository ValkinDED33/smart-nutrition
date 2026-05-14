import { arrayMove, arraySwap } from "@dnd-kit/sortable";

export const reorderItems = <Item>(items: Item[], fromIndex: number, toIndex: number) =>
  arrayMove(items, fromIndex, toIndex);

export const swapItems = <Item>(items: Item[], firstIndex: number, secondIndex: number) =>
  arraySwap(items, firstIndex, secondIndex);
