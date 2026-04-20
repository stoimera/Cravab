'use client'

import { motion } from 'framer-motion'
import { AnimatedListItem } from '@/components/ui/AnimatedList'
import { FloatingCard } from '@/components/ui/AnimatedCard'
import { cn } from '@/lib/utils'

// Example data
const exampleItems = [
  { id: 1, title: 'Call #1', status: 'completed', time: '2:30 PM' },
  { id: 2, title: 'Call #2', status: 'in-progress', time: '2:45 PM' },
  { id: 3, title: 'Call #3', status: 'scheduled', time: '3:00 PM' },
  { id: 4, title: 'Call #4', status: 'completed', time: '3:15 PM' },
  { id: 5, title: 'Call #5', status: 'cancelled', time: '3:30 PM' },
]

interface AnimatedListExampleProps {
  className?: string
}

export function AnimatedListExample({ className }: AnimatedListExampleProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-xl font-semibold mb-4">Animated List Example</h2>
      
      {/* Floating Card Container */}
      <FloatingCard className="p-6">
        <h3 className="text-lg font-medium mb-4">Recent Calls</h3>
        
        {/* Animated List Items */}
        <div className="space-y-3">
          {exampleItems.map((item, index) => (
            <AnimatedListItem
              key={item.id}
              index={index}
              animationType="fade"
              staggerDelay={index * 50}
              enableSwipeToDelete={false}
              onDelete={() => {}}
              isDeleting={false}
            >
              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
                <motion.span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    item.status === 'completed' && 'bg-green-100 text-green-800',
                    item.status === 'in-progress' && 'bg-blue-100 text-blue-800',
                    item.status === 'scheduled' && 'bg-yellow-100 text-yellow-800',
                    item.status === 'cancelled' && 'bg-red-100 text-red-800'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.status}
                </motion.span>
              </div>
              </div>
            </AnimatedListItem>
          ))}
        </div>
      </FloatingCard>
    </div>
  )
}

// Example of a tabbed interface with animations
export function AnimatedTabsExample() {
  const tabs = [
    { id: 'all', label: 'All Calls' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending', label: 'Pending' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Animated Tabs Example</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            className="relative flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            {tab.label}
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-background rounded-md shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </motion.button>
        ))}
      </div>
      
      {/* Tab Content */}
      <FloatingCard className="p-6">
        <p className="text-muted-foreground">Tab content would go here...</p>
      </FloatingCard>
    </div>
  )
}
