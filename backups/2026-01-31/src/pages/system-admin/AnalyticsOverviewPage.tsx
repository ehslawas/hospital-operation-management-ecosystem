import React from 'react'
import SystemAdminDashboard from './SystemAdminDashboard'

// For now, reuse the Dashboard as the Analytics Overview since it covers the requirements
// In future, this page can have more detailed charts, date range pickers, and export options
const AnalyticsOverviewPage = () => {
    return <SystemAdminDashboard />
}

export default AnalyticsOverviewPage
