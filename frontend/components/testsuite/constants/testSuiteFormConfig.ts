'use client';

import type { FormFieldConfig } from '../../testcase/subcomponents/TestCaseFormField';
import { TestSuite } from '../types';

// テストスイートのステータス選択肢。値は DropdownOption(seed) の
// entity='TestSuite', field='status' と一致させること。
export const STATUS_OPTIONS = [
  { label: '未着手', value: 'NOT_STARTED' },
  { label: '計画中', value: 'PLANNED' },
  { label: '実行中', value: 'IN_PROGRESS' },
  { label: '一時停止', value: 'PAUSED' },
  { label: '完了', value: 'COMPLETED' },
  { label: 'キャンセル', value: 'CANCELLED' },
  { label: 'Regression test updated', value: 'Regression test updated' },
];

export function getTestSuiteFormFields(parentSuites: TestSuite[] = []): FormFieldConfig[] {
  const parentOptions = parentSuites
    .filter(s => !s.parentId) // Only root level suites can be parents
    .map((suite) => ({
      label: suite.name,
      value: suite.id,
    }));

  return [
    {
      name: 'name',
      label: 'Suite Name',
      type: 'text',
      placeholder: 'Enter test suite name',
      required: true,
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter suite description',
      rows: 3,
      maxLength: 250,
    },
    {
      name: 'parentId',
      label: 'Parent Suite',
      type: 'select',
      placeholder: 'Select parent suite',
      options: [
        { label: 'None (Root Level)', value: 'none' },
        ...parentOptions,
      ],
    },
  ];
}

export function getCreateTestSuiteFormFields(
  parentSuites: TestSuite[] = []
): FormFieldConfig[] {
  return getTestSuiteFormFields(parentSuites);
}

export function getEditTestSuiteFormFields(
  parentSuites: TestSuite[] = []
): FormFieldConfig[] {
  return getTestSuiteFormFields(parentSuites);
}
