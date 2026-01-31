import React from 'react'

const ReportsPage = () => {
  console.log('ReportsPage mounted - Minimal Version')
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports Page (Debug)</h1>
      <div className="p-4 border rounded-xl bg-gray-50">
        <p className="mb-4">Reports module debug mode. No external dependencies.</p>
      </div>
    </div>
  )
}

export { ReportsPage }
export default ReportsPage
