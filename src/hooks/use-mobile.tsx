/* Use Mobile Hook - A hook that checks if the screen is mobile - from shadcn/ui (exposes useIsMobile) */
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(prevMobile => prevMobile !== mobile ? mobile : prevMobile)
    }
    mql.addEventListener('change', onChange)
    // Set initial value
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
