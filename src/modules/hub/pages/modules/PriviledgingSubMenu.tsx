import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const PriviledgingSubMenu: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/priviledging', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-sm text-slate-500">
        Memuatkan MyPriviledging...
      </div>
    </div>
  )
}

export default PriviledgingSubMenu
