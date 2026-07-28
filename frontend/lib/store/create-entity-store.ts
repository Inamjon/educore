import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

export interface WithMeta {
  id: string;
  deletedAt?: string | null;
}

export interface EntityState<T extends WithMeta> {
  items: T[];
  add: (item: Omit<T, "id"> & { id?: string }) => T;
  update: (id: string, patch: Partial<T>) => void;
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  getActive: () => T[];
}

export type EntityStore<T extends WithMeta> = UseBoundStore<StoreApi<EntityState<T>>>;

export function createEntityStore<T extends WithMeta>(
  storageKey: string,
  seed: T[],
  idPrefix: string
): EntityStore<T> {
  return create<EntityState<T>>()(
    persist(
      (set, get) => ({
        items: seed,
        add: (item) => {
          const newItem = { ...item, id: item.id ?? `${idPrefix}${Date.now()}` } as T;
          set((s) => ({ items: [newItem, ...s.items] }));
          return newItem;
        },
        update: (id, patch) =>
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          })),
        softDelete: (id) => get().update(id, { deletedAt: new Date().toISOString() } as Partial<T>),
        restore: (id) => get().update(id, { deletedAt: null } as Partial<T>),
        getActive: () => get().items.filter((i) => !i.deletedAt),
      }),
      { name: storageKey, version: 1 }
    )
  );
}
