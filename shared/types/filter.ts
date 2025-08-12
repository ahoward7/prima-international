export interface FilterOption {
  label: string
  data: string | number
}

export interface FilterOptions { [key: string]: FilterOption[] }
export interface StringObject { [key: string]: string[] }
