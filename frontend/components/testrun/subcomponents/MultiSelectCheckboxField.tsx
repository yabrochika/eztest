'use client';

import { Checkbox } from '@/frontend/reusable-elements/checkboxes/Checkbox';
import { parseMultiValueField, serializeMultiValueField } from '../utils/multiValueField';

export interface MultiSelectCheckboxFieldProps {
  fieldName: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ value: string; label: string }>;
  emptyLabel: string;
}

export function MultiSelectCheckboxField({
  fieldName,
  value,
  onChange,
  options,
  emptyLabel,
}: MultiSelectCheckboxFieldProps) {
  const selectedValues = parseMultiValueField(value);

  const toggleValue = (targetValue: string) => {
    const nextValues = selectedValues.includes(targetValue)
      ? selectedValues.filter((item) => item !== targetValue)
      : [...selectedValues, targetValue];
    onChange(serializeMultiValueField(nextValues) || '');
  };

  return (
    <div className="rounded-md border border-[#334155] bg-[#0f172a] p-3 space-y-2">
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const id = `${fieldName}-${option.value}-checkbox`;
          const isChecked = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex items-center gap-2 text-sm text-white/90 cursor-pointer"
            >
              <Checkbox
                id={id}
                variant="glass"
                checked={isChecked}
                onCheckedChange={() => toggleValue(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {selectedValues.length === 0 && (
        <p className="text-xs text-white/50">{emptyLabel}</p>
      )}
    </div>
  );
}
