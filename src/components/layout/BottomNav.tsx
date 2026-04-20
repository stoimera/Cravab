'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Phone, Users, Calendar, BarChart3, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  activeTab: 'calls' | 'clients' | 'appointments' | 'reports' | 'more'
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      id: 'calls',
      label: 'Calls',
      href: '/calls',
      icon: Phone,
    },
    {
      id: 'clients',
      label: 'Clients',
      href: '/clients',
      icon: Users,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      href: '/appointments',
      icon: Calendar,
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
    {
      id: 'more',
      label: 'More',
      href: '/more',
      icon: MoreHorizontal,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-1.5 sm:py-2 z-50 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Link 
              key={item.id}
              href={item.href} 
              className={cn(
                'flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl transition-colors duration-200 min-w-[50px] sm:min-w-[60px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 w-full"
              >
                <div className="relative">
                  <Icon 
                    size={18} 
                    className={cn(
                      'sm:w-5 sm:h-5 transition-transform duration-200',
                      isActive && 'scale-110'
                    )} 
                  />
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -inset-1 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium font-inter transition-all duration-200 leading-tight">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
