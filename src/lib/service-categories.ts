/**
 * Get service categories based on business type
 */
export function getServiceCategories(businessType: string | null | undefined): Array<{ value: string; label: string }> {
  // Normalize business type for comparison
  const normalizedBusinessType = businessType?.toLowerCase().trim()

  // Car Detailing business types
  if (normalizedBusinessType === 'car detailing' || 
      normalizedBusinessType === 'auto detailing' || 
      normalizedBusinessType === 'detailing') {
    return [
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'repair', label: 'Repair' },
      { value: 'coating', label: 'Coating' },
      { value: 'detailing', label: 'Detailing' },
      { value: 'washing', label: 'Washing' },
      { value: 'installation', label: 'Installation' },
      { value: 'ppf', label: 'PPF' },
      { value: 'other', label: 'Other' }
    ]
  }

  // Default categories for other business types
  return [
    { value: 'repair', label: 'Repair' },
    { value: 'installation', label: 'Installation' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'other', label: 'Other' }
  ]
}
