'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Phone, 
  Users, 
  Calendar, 
  BarChart3, 
  MoreHorizontal,
  Settings,
  FileText,
  Bot,
  Wrench,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers'

interface DesktopLayoutProps {
  children: React.ReactNode
  activeTab?: 'calls' | 'clients' | 'appointments' | 'reports' | 'more'
  title?: string
  actions?: React.ReactNode
}

export function DesktopLayout({ children, activeTab, title, actions }: DesktopLayoutProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const mainNavItems = [
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
  ]

  const moreNavItems = [
    {
      id: 'services',
      label: 'Services',
      href: '/services',
      icon: Wrench,
    },
    {
      id: 'sop-hub',
      label: 'SOP Hub',
      href: '/sop-hub',
      icon: FileText,
    },
    {
      id: 'jarvis',
      label: 'Jarvis AI',
      href: '/jarvis',
      icon: Bot,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Rail */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground font-inter">CRAVAB</h1>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* More Section */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground font-inter">
              {title || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
              {actions}
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
