'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateCSV, downloadCSV } from '@/lib/export';
import {
  getLeadLists,
  createLeadList,
  deleteLeadList,
  getPropertiesForList,
  addPropertiesToList as apiAddPropertiesToList,
  removePropertyFromList as apiRemovePropertyFromList,
  updatePropertyStatusInList as apiUpdatePropertyStatusInList,
  bulkUpdatePropertyStatus as apiBulkUpdatePropertyStatus
} from '@/lib/supabase-leads';
import { Property } from '@/types';

export type { Property };

// Types
export type PropertyStatus = 'new' | 'contacted' | 'interested' | 'skip' | 'converted';

export interface LeadList {
  id: string;
  name: string;
  description: string;
  properties: Property[];
  createdAt: string;
  updatedAt: string;
}

export function useLeadLists() {
  const [lists, setLists] = useState<LeadList[]>([]);
  const [currentList, setCurrentList] = useState<LeadList | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load lists from Supabase
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLeadLists();
      // Map Supabase snake_case to CamelCase for the UI
      const mappedLists = data.map(list => ({
        ...list,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      }));
      setLists(mappedLists);
    } catch (error) {
      console.error('Error fetching lead lists:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // CRUD Operations
  const createList = useCallback(
    async (name: string, description: string, properties: Property[] = []) => {
      setIsLoading(true);
      try {
        const newList = await createLeadList(name, description);

        // If properties are provided, add them immediately
        if (properties.length > 0) {
          await apiAddPropertiesToList(newList.id, properties.map(p => p.id));
        }

        const mappedNewList = {
          ...newList,
          properties: properties,
          createdAt: newList.created_at,
          updatedAt: newList.updated_at,
        };

        setLists((prev) => [...prev, mappedNewList]);
        return mappedNewList;
      } catch (error) {
        console.error('Error creating list:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateList = useCallback(
    async (id: string, updates: Partial<Pick<LeadList, 'name' | 'description'>>) => {
      setIsLoading(true);
      try {
        // Implementation for update lead list in Supabase would go here
      } catch (error) {
        console.error('Error updating list:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteList = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await deleteLeadList(id);
        setLists((prev) => prev.filter((list) => list.id !== id));
        if (currentList?.id === id) {
          setCurrentList(null);
        }
      } catch (error) {
        console.error('Error deleting list:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  const getListById = useCallback(
    async (id: string) => {
      try {
        const properties = await getPropertiesForList(id);
        const allLists = await getLeadLists();
        const list = allLists.find(l => l.id === id);

        if (!list) return null;

        return {
          ...list,
          properties,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
        };
      } catch (error) {
        console.error('Error fetching list details:', error);
        return null;
      }
    },
    []
  );

  const setCurrentListById = useCallback(
    async (id: string) => {
      const list = await getListById(id);
      setCurrentList(list);
      setSelectedProperties(new Set());
    },
    [getListById]
  );

  // Property operations within a list
  const addPropertiesToList = useCallback(
    async (listId: string, propertiesToAdd: Property[]) => {
      setIsLoading(true);
      try {
        await apiAddPropertiesToList(listId, propertiesToAdd.map(p => p.id));

        // Refresh current list if it's the one being updated
        if (currentList?.id === listId) {
          const updatedProps = await getPropertiesForList(listId);
          setCurrentList(prev => prev ? { ...prev, properties: updatedProps as Property[] } : null);
        }
      } catch (error) {
        console.error('Error adding properties to list:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  const removePropertyFromList = useCallback(
    async (listId: string, propertyId: string) => {
      setIsLoading(true);
      try {
        await apiRemovePropertyFromList(listId, propertyId);

        if (currentList?.id === listId) {
          const updatedProps = await getPropertiesForList(listId);
          setCurrentList(prev => prev ? { ...prev, properties: updatedProps as Property[] } : null);
        }
        setSelectedProperties((prev) => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } catch (error) {
        console.error('Error removing property from list:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  const updatePropertyStatus = useCallback(
    async (listId: string, propertyId: string, status: PropertyStatus) => {
      setIsLoading(true);
      try {
        await apiUpdatePropertyStatusInList(listId, propertyId, status);

        if (currentList?.id === listId) {
          const updatedProps = await getPropertiesForList(listId);
          setCurrentList(prev => prev ? { ...prev, properties: updatedProps as Property[] } : null);
        }
      } catch (error) {
        console.error('Error updating property status:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  const bulkUpdateStatus = useCallback(
    async (listId: string, propertyIds: string[], status: PropertyStatus) => {
      setIsLoading(true);
      try {
        await apiBulkUpdatePropertyStatus(listId, propertyIds, status);

        if (currentList?.id === listId) {
          const updatedProps = await getPropertiesForList(listId);
          setCurrentList(prev => prev ? { ...prev, properties: updatedProps as Property[] } : null);
        }
        setSelectedProperties(new Set());
      } catch (error) {
        console.error('Error bulk updating status:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  const bulkRemoveProperties = useCallback(
    async (listId: string, propertyIds: string[]) => {
      setIsLoading(true);
      try {
        for (const id of propertyIds) {
          await removePropertyFromList(listId, id);
        }

        if (currentList?.id === listId) {
          const updatedProps = await getPropertiesForList(listId);
          setCurrentList(prev => prev ? { ...prev, properties: updatedProps } : null);
        }
        setSelectedProperties(new Set());
      } catch (error) {
        console.error('Error bulk removing properties:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentList]
  );

  // Selection operations
  const togglePropertySelection = useCallback((propertyId: string) => {
    setSelectedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  }, []);

  const selectAllProperties = useCallback((propertyIds: string[]) => {
    setSelectedProperties(new Set(propertyIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProperties(new Set());
  }, []);

  // Export functionality
  const exportList = useCallback(
    async (listId: string, format: 'csv' | 'excel' = 'csv', fields?: string[]) => {
      const list = await getListById(listId);
      if (!list) return;

      const defaultFields = [
        'address',
        'city',
        'state',
        'zip',
        'estimated_value',
        'equity',
        'equity_percent',
        'owner_type',
        'status',
        'tags',
        'owner_name',
      ];
      const selectedFields = fields || defaultFields;

      const csvContent = generateCSV(list.properties, selectedFields);
      const filename = `${list.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        downloadCSV(csvContent, filename);
      }
    },
    [getListById]
  );

  const exportSelectedProperties = useCallback(
    async (listId: string, propertyIds: string[], format: 'csv' | 'excel' = 'csv', fields?: string[]) => {
      const list = await getListById(listId);
      if (!list) return;

      const propertiesToExport = list.properties.filter((p) => propertyIds.includes(p.id));
      const defaultFields = [
        'address',
        'city',
        'state',
        'zip',
        'estimated_value',
        'equity',
        'equity_percent',
        'owner_type',
        'status',
        'tags',
        'owner_name',
      ];
      const selectedFields = fields || defaultFields;

      const csvContent = generateCSV(propertiesToExport, selectedFields);
      const filename = `${list.name.replace(/\s+/g, '_')}_selected_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        downloadCSV(csvContent, filename);
      }
    },
    [getListById]
  );

  // Stats
  const getListStats = useCallback(
    (listId: string) => {
      if (!currentList || currentList.id !== listId) {
        return { total: 0, contacted: 0, interested: 0, skipped: 0, converted: 0 };
      }
      const properties = currentList.properties;
      return {
        total: properties.length,
        contacted: properties.filter((p) => p.status === 'contacted').length,
        interested: properties.filter((p) => p.status === 'interested').length,
        skipped: properties.filter((p) => p.status === 'skip').length,
        converted: properties.filter((p) => p.status === 'converted').length,
      };
    },
    [currentList]
  );

  return {
    lists,
    currentList,
    selectedProperties,
    isLoading,
    createList,
    updateList,
    deleteList,
    getListById,
    setCurrentListById,
    addPropertiesToList,
    removePropertyFromList,
    updatePropertyStatus,
    bulkUpdateStatus,
    bulkRemoveProperties,
    togglePropertySelection,
    selectAllProperties,
    clearSelection,
    exportList,
    exportSelectedProperties,
    getListStats,
  };
}
