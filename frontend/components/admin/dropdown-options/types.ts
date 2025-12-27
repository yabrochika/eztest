export interface DropdownOption {
  id: string;
  entity: string;
  field: string;
  value: string;
  label: string;
  color?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDropdownOptionInput {
  entity: string;
  field: string;
  value: string;
  label: string;
  order?: number;
}

export interface UpdateDropdownOptionInput {
  label?: string;
  order?: number;
  isActive?: boolean;
}

