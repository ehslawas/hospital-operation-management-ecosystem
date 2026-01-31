import React from 'react'
import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

const ModulePlaceholderPage: React.FC = () => {
    const { pathname } = useLocation()

    // Extract module name from path (e.g., /emergency/triage -> Emergency)
    const moduleName = pathname.split('/')[1]?.charAt(0).toUpperCase() + pathname.split('/')[1]?.slice(1) || 'Module'
    const featureName = pathname.split('/')[2]?.charAt(0).toUpperCase() + pathname.split('/')[2]?.slice(1) || ''

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-primary-50 p-6 rounded-full mb-6">
                <Construction className="w-16 h-16 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {moduleName} Module
            </h1>
            {featureName && (
                <h2 className="text-xl font-medium text-gray-600 mb-4">
                    {featureName}
                </h2>
            )}
            <p className="text-gray-500 max-w-md mx-auto mb-8">
                This module is currently under active development.
                We are working hard to bring you these features soon.
            </p>
            <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">
                Path: <code className="ml-2 text-primary-600">{pathname}</code>
            </div>
        </div>
    )
}

export default ModulePlaceholderPage
