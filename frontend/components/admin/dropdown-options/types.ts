export interface DropdownOption {
  id: string;
  entity: string;
  field: string;
  value: string;
  label: string;
  order: number;
  isActive: boolean;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDropdownOptionInput {
  entity: string;
  field: string;
  value: string;
  label: string;
  order?: number;
  color?: string;
}

export interface UpdateDropdownOptionInput {
  label?: string;
  order?: number;
  color?: string;
  isActive?: boolean;
}

