declare module 'react-day-picker' {
  import * as React from 'react'
  
  export type DateRange = { from: Date | undefined; to: Date | undefined }
  
  export interface DayPickerProps {
    mode?: 'single' | 'range' | 'multiple'
    selected?: Date | DateRange | Date[] | undefined
    onSelect?: (date: Date | DateRange | Date[] | undefined) => void
    disabled?: boolean | Date | ((date: Date) => boolean) | Array<Date | { from: Date; to: Date }>
    defaultMonth?: Date
    numberOfMonths?: number
    captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'buttons'
    initialFocus?: boolean
    className?: string
    classNames?: Record<string, string>
    showOutsideDays?: boolean
    [key: string]: any
  }
  
  export class DayPicker extends React.Component<DayPickerProps> {}
  
  export default DayPicker
}

