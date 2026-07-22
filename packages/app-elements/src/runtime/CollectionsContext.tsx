import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea';
  placeholder?: string;
}

export interface FormSchema {
  title: string;
  description?: string;
  submitButtonLabel?: string;
  fields: FormField[];
  submitsTo: string;
}

export type CollectionItem = Record<string, string>;

export interface CollectionsContextValue {
  collections: Record<string, CollectionItem[]>;
  append(name: string, item: CollectionItem): void;
  remove(name: string, index: number): void;
  get(name: string): CollectionItem[];
  navigateToPage?: (pageId: string) => void;
  activeForm: FormSchema | null;
  openForm(schema: FormSchema): void;
  closeForm(): void;
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function useCollections() {
  return useContext(CollectionsContext);
}

interface CollectionsProviderProps {
  initialCollections?: Record<string, CollectionItem[]>;
  navigateToPage?: (pageId: string) => void;
  children: ReactNode;
}

export function CollectionsProvider({
  initialCollections = {},
  navigateToPage,
  children,
}: CollectionsProviderProps) {
  const [collections, setCollections] = useState<Record<string, CollectionItem[]>>(initialCollections);
  const [activeForm, setActiveForm] = useState<FormSchema | null>(null);

  const append = useCallback((name: string, item: CollectionItem) => {
    setCollections((prev) => ({
      ...prev,
      [name]: [...(prev[name] ?? []), item],
    }));
  }, []);

  const remove = useCallback((name: string, index: number) => {
    setCollections((prev) => ({
      ...prev,
      [name]: (prev[name] ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  const get = useCallback((name: string) => collections[name] ?? [], [collections]);
  const openForm = useCallback((schema: FormSchema) => setActiveForm(schema), []);
  const closeForm = useCallback(() => setActiveForm(null), []);

  const value = useMemo<CollectionsContextValue>(() => ({
    collections,
    append,
    remove,
    get,
    navigateToPage,
    activeForm,
    openForm,
    closeForm,
  }), [collections, append, remove, get, navigateToPage, activeForm, openForm, closeForm]);

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}
