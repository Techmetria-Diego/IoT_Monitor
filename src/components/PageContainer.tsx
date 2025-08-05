import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * PageContainer component that provides consistent full-width layouts with responsive padding
 * Replaces the old container mx-auto pattern with a more flexible approach
 */
export const PageContainer = ({ 
  children, 
  className, 
  maxWidth = 'none',
  padding = 'lg'
}: PageContainerProps) => {
  const maxWidthClasses = {
    none: 'max-w-none',
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-3',
    md: 'px-3 sm:px-4 lg:px-5',
    lg: 'px-4 lg:px-6 xl:px-8 2xl:px-12',
    xl: 'px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20',
  }

  return (
    <div className={cn(
      'w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      maxWidth !== 'none' && 'mx-auto',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Specific container for full-width layouts (dashboards, tables, etc.)
 */
export const FullWidthContainer = ({ children, className }: { children: ReactNode, className?: string }) => (
  <PageContainer maxWidth="none" padding="lg" className={cn('py-8', className)}>
    {children}
  </PageContainer>
)

/**
 * Container for content that should have a reasonable max-width (settings, forms, etc.) 
 */
export const ContentContainer = ({ children, className }: { children: ReactNode, className?: string }) => (
  <PageContainer maxWidth="6xl" padding="lg" className={cn('py-8', className)}>
    {children}
  </PageContainer>
)

/**
 * Container for narrow content (auth pages, simple cards, etc.)
 */
export const NarrowContainer = ({ children, className }: { children: ReactNode, className?: string }) => (
  <PageContainer maxWidth="2xl" padding="md" className={cn('py-8', className)}>
    {children}
  </PageContainer>
)
