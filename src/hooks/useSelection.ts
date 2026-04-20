/**
 * Selection Management Hook
 * Manages multi-select state for lists with PWA detection
 */

import { useState, useCallback, useEffect } from 'react'
import { usePWA } from './usePWA'

export interface SelectionState<T> {
  selectedItems: Set<string>
  isSelectionMode: boolean
  selectAll: boolean
  totalItems: number
  selectedCount: number
}

export interface SelectionActions<T> {
  toggleItem: (id: string) => void
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  toggleSelectAll: () => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  isSelected: (id: string) => boolean
  getSelectedItems: (items: T[], idKey: keyof T) => T[]
}

export function useSelection<T>(
  items: T[],
  idKey: keyof T,
  options: {
    enablePWAOnly?: boolean
    longPressDuration?: number
  } = {}
) {
  const { isInstalled } = usePWA()
  const { enablePWAOnly = true, longPressDuration = 1500 } = options

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Check if selection should be enabled
  const isSelectionEnabled = enablePWAOnly ? isInstalled : true

  const totalItems = items.length
  const selectedCount = selectedItems.size
  const selectAll = selectedCount === totalItems && totalItems > 0

  const toggleItem = useCallback((id: string) => {
    if (!isSelectionEnabled) return

    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [isSelectionEnabled])

  const selectItem = useCallback((id: string) => {
    if (!isSelectionEnabled) return

    setSelectedItems(prev => new Set([...prev, id]))
  }, [isSelectionEnabled])

  const deselectItem = useCallback((id: string) => {
    if (!isSelectionEnabled) return

    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [isSelectionEnabled])

  const selectAllItems = useCallback(() => {
    if (!isSelectionEnabled) return

    const allIds = items.map(item => String(item[idKey]))
    setSelectedItems(new Set(allIds))
  }, [items, idKey, isSelectionEnabled])

  const deselectAll = useCallback(() => {
    if (!isSelectionEnabled) return

    setSelectedItems(new Set())
  }, [isSelectionEnabled])

  const toggleSelectAll = useCallback(() => {
    if (!isSelectionEnabled) return

    if (selectAll) {
      deselectAll()
    } else {
      selectAllItems()
    }
  }, [selectAll, deselectAll, selectAllItems, isSelectionEnabled])

  const enterSelectionMode = useCallback(() => {
    if (!isSelectionEnabled) return

    setIsSelectionMode(true)
  }, [isSelectionEnabled])

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedItems(new Set())
  }, [])

  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id)
  }, [selectedItems])

  const getSelectedItems = useCallback((items: T[], idKey: keyof T) => {
    return items.filter(item => selectedItems.has(String(item[idKey])))
  }, [selectedItems])

  // Auto-exit selection mode if no items selected
  useEffect(() => {
    if (isSelectionMode && selectedCount === 0) {
      setIsSelectionMode(false)
    }
  }, [isSelectionMode, selectedCount])

  // Clear selection when items change
  useEffect(() => {
    setSelectedItems(new Set())
  }, [items])

  const state: SelectionState<T> = {
    selectedItems,
    isSelectionMode,
    selectAll,
    totalItems,
    selectedCount
  }

  const actions: SelectionActions<T> = {
    toggleItem,
    selectItem,
    deselectItem,
    selectAll: selectAllItems,
    deselectAll,
    toggleSelectAll,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    getSelectedItems
  }

  return {
    ...state,
    ...actions,
    isSelectionEnabled,
    longPressDuration
  }
}
