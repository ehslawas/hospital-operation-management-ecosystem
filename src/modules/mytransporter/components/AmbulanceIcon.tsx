import React from 'react'

export const Ambulance: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="16" height="10" x="2" y="6" rx="2" />
    <path d="M14 16H8" />
    <path d="M10 11h4" />
    <path d="M12 9v4" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="16" cy="18" r="2" />
    <path d="M18 10h3l1 2v4h-4" />
    <circle cx="19" cy="18" r="2" />
  </svg>
)

export default Ambulance
