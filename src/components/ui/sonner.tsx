'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm',
          description: 'group-[.toast]:text-gray-600',
          actionButton:
            'group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:hover:bg-blue-700 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:hover:bg-gray-200 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium',
          success: 'group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-900',
          error: 'group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-900',
          warning: 'group-[.toaster]:bg-yellow-50 group-[.toaster]:border-yellow-200 group-[.toaster]:text-yellow-900',
          info: 'group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-900',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
