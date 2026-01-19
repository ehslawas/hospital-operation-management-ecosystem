import * as LucideIcons from 'lucide-react'

/**
 * Icon mapping utility
 * Maps icon names from database to Lucide React components
 */
export const getIconComponent = (iconName: string): React.ElementType => {
    // Default to Package icon if not found
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Package
    return IconComponent
}
