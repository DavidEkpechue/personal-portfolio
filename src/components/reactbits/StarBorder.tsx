import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface StarBorderProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

// Adapted from React Bits StarBorder: two points of light travel the top and
// bottom edges of the control. Transform-only, paused for reduced motion.
export default function StarBorder({ children, className = '', ...props }: StarBorderProps) {
  return <a className={`star-border ${className}`} {...props}>
    <span className="star-border-light star-border-light-bottom" aria-hidden="true" />
    <span className="star-border-light star-border-light-top" aria-hidden="true" />
    <span className="star-border-inner">{children}</span>
  </a>
}
