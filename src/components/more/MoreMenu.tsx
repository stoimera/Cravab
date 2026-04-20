'use client'

import { logger } from '@/lib/logger'
import Link from 'next/link'
import { 
  Settings, 
  Bot, 
  LogOut,
  Wrench,
  Calendar,
  FolderOpen,
  Zap,
  // BookOpen, // Commented out for SOP Hub - will implement later
  Shield,
  FileText,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database-comprehensive'
import { toast } from 'sonner'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export function MoreMenu() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole>('worker')
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData && !error) {
          const roleData = userData as { role: UserRole }
          setUserRole(roleData.role)
        }
      }
    }

    fetchUserRole()
  }, [])

  const isAdmin = userRole === 'admin'

  const menuItems = [
    {
      id: 'appointments',
      label: 'Appointments',
      description: 'View and manage appointments',
      href: '/appointments-list',
      icon: Calendar,
    },
    {
      id: 'documents',
      label: 'Documents',
      description: 'Manage your documents and files',
      href: '/documents',
      icon: FolderOpen,
    },
    ...(isAdmin ? [{
      id: 'ai-integration',
      label: 'AI Integration',
      description: 'Configure Vapi AI for call handling',
      href: '/ai-integration',
      icon: Zap,
    }] : []),
    {
      id: 'services',
      label: 'Services',
      description: 'Manage your service catalog',
      href: '/services',
      icon: Wrench,
    },
    // {
    //   id: 'sop-hub',
    //   label: 'SOP Hub',
    //   description: 'Standard operating procedures',
    //   href: '/sop-hub',
    //   icon: BookOpen,
    // }, // Commented out - will implement later
    {
      id: 'jarvis',
      label: 'Jarvis AI',
      description: 'AI assistant & automation',
      href: '/jarvis',
      icon: Bot,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App preferences & account',
      href: '/settings',
      icon: Settings,
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      description: 'Manage your data and privacy preferences',
      href: '/privacy',
      icon: Shield,
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      description: 'View our terms and conditions',
      href: '/terms',
      icon: FileText,
    },
  ]

  

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    try {
      setIsSigningOut(true)
      await signOut()
      // Redirect to login page after successful signout
      router.push('/auth/login')
    } catch (error) {
      logger.error('Failed to sign out:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="space-y-0">
        {menuItems.map((item) => {
          const Icon = item.icon
          
          return (
            <div
              key={item.id}
              className="w-full text-left p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 cursor-pointer interactive"
            >
              <Link href={item.href} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full text-left p-4 border-b border-gray-200 hover:bg-red-50/50 cursor-pointer interactive disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              
              <div>
                <h3 className="font-medium text-red-600">
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </h3>
                <p className="text-sm text-red-500">
                  {isSigningOut ? 'Please wait...' : 'Sign out of your account'}
                </p>
              </div>
            </div>
            
            <ChevronRight className="w-5 h-5 text-red-400" />
          </div>
        </button>
      </div>
    </div>
  )
}
