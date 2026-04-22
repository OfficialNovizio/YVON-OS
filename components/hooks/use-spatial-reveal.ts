import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useSpatialReveal(refs: React.RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.forEach((ref) => {
        if (!ref.current) return
        gsap.fromTo(ref.current,
          { opacity: 0, scale: 0.95, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            ease: 'expo.out',
            immediateRender: false,
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 95%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    })
    return () => ctx.revert()
  }, [refs])
}
