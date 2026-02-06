'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestCase, Module } from '../types';
import { useEffect, useState } from 'react';
import { attachmentStorage } from '@/lib/attachment-storage';
import type { Attachment } from '@/lib/s3';
import { uploadFileToS3 } from '@/lib/s3';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

interface CreateTestCaseDialogProps {
  projectId: string;
  defaultModuleId?: string;
  open?: boolean;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestCaseCreated: (testCase: TestCase) => void;
}

export function CreateTestCaseDialog({
  projectId,
  defaultModuleId,
  open,
  triggerOpen,
  onOpenChange,
  onTestCaseCreated,
}: CreateTestCaseDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [descriptionAttachments, setDescriptionAttachments] = useState<Attachment[]>([]);
  // TODO: Uncomment for future use - Expected Result field at test case level
  // const [expectedResultAttachments, setExpectedResultAttachments] = useState<Attachment[]>([]);
  const [preconditionsAttachments, setPreconditionsAttachments] = useState<Attachment[]>([]);
  const [postconditionsAttachments, setPostconditionsAttachments] = useState<Attachment[]>([]);

  // Fetch dynamic dropdown options
  const { options: priorityOptions } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptions } = useDropdownOptions('TestCase', 'status');
  const { options: domainOptions } = useDropdownOptions('TestCase', 'domain');
  const { options: functionOptions } = useDropdownOptions('TestCase', 'function');
  const { options: layerOptions } = useDropdownOptions('TestCase', 'layer');
  const { options: testTypeOptions } = useDropdownOptions('TestCase', 'testType');
  const { options: targetOptions } = useDropdownOptions('TestCase', 'target');
  const { options: automationOptions } = useDropdownOptions('TestCase', 'automation');
  const { options: environmentOptions } = useDropdownOptions('TestCase', 'environment');
  const { options: moduleCategoryOptions } = useDropdownOptions('TestCase', 'moduleCategory');
  const { options: featureCategoryOptions } = useDropdownOptions('TestCase', 'featureCategory');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/modules`);
        const data = await response.json();
        if (data.data) {
          setModules(data.data);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };
    
    fetchModules();
    
    // Set attachment context when dialog opens
    if (open !== false) {
      attachmentStorage.setContext({
        entityType: 'testcase',
        projectId,
      });
    }
    
    return () => {
      // Clear context when dialog closes
      if (open === false) {
        attachmentStorage.clearContext();
      }
    };
  }, [projectId, open]);

  const moduleOptions = modules.map(module => ({
    value: module.id,
    label: module.name,
  }));

  const fields: BaseDialogField[] = [
    {
      name: 'title',
      label: 'タイトル',
      placeholder: 'テストケースタイトルを入力',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 200,
      cols: 2,
    },
    {
      name: 'priority',
      label: '優先度',
      type: 'select',
      defaultValue: 'MEDIUM',
      options: priorityOptions.map(opt => ({ value: opt.value, label: opt.label })),
      cols: 1,
    },
    {
      name: 'status',
      label: 'ステータス',
      type: 'select',
      defaultValue: 'DRAFT',
      options: statusOptions.map(opt => ({ value: opt.value, label: opt.label })),
      cols: 1,
    },
    {
      name: 'moduleId',
      label: 'モジュール',
      type: 'select',
      placeholder: 'モジュールを選択',
      defaultValue: defaultModuleId || 'none',
      options: [
        { value: 'none', label: 'なし（モジュールなし）' },
        ...moduleOptions,
      ],
      cols: 1,
    },
    {
      name: 'estimatedTime',
      label: '見積時間（分）',
      type: 'number',
      placeholder: '見積時間を入力',
      cols: 1,
    },
    {
      name: 'domain',
      label: 'ドメイン',
      type: 'select',
      placeholder: 'ドメインを選択',
      options: [
        { value: 'none', label: 'なし' },
        ...domainOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'function',
      label: '機能',
      type: 'select',
      placeholder: '機能を選択',
      options: [
        { value: 'none', label: 'なし' },
        ...functionOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'rtcId',
      label: 'RTC-ID',
      type: 'text',
      placeholder: 'RTC-IDを入力',
      cols: 1,
    },
    {
      name: 'flowId',
      label: 'Flow-ID',
      type: 'text',
      placeholder: 'Flow-IDを入力',
      cols: 1,
    },
    {
      name: 'layer',
      label: 'レイヤー',
      type: 'select',
      placeholder: 'レイヤーを選択',
      options: [
        { value: 'none', label: 'なし' },
        ...layerOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'target',
      label: '対象（API/画面）',
      type: 'select',
      placeholder: '対象を選択',
      options: [
        { value: 'none', label: 'なし' },
        ...targetOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'testType',
      label: 'テスト種別',
      type: 'select',
      placeholder: 'テスト種別を選択',
      options: [
        { value: 'none', label: 'なし' },
        ...testTypeOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'automation',
      label: '自動化',
      type: 'select',
      placeholder: '自動化ステータスを選択',
      options: [
        { value: 'none', label: 'なし' },
        ...automationOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'environment',
      label: '環境',
      type: 'select',
      placeholder: '環境を選択',
      options: [
        { value: 'none', label: 'なし' },
        ...environmentOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'moduleCategory',
      label: 'ドメイン',
      type: 'select',
      placeholder: 'ドメインを選択',
      options: [
        { value: 'none', label: 'なし' },
        ...moduleCategoryOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'featureCategory',
      label: '機能',
      type: 'select',
      placeholder: '機能を選択',
      options: [
        { value: 'none', label: 'なし' },
        ...featureCategoryOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 1,
    },
    {
      name: 'evidence',
      label: '根拠コード',
      type: 'text',
      placeholder: '根拠コードを入力',
      cols: 1,
    },
    {
      name: 'notes',
      label: '備考',
      type: 'textarea',
      placeholder: '備考を入力',
      rows: 2,
      cols: 1,
    },
    {
      name: 'description',
      label: '説明',
      type: 'textarea-with-attachments',
      placeholder: 'テストケースの説明を入力',
      rows: 3,
      cols: 1,
      attachments: descriptionAttachments,
      onAttachmentsChange: setDescriptionAttachments,
    },
    // TODO: Uncomment for future use - Expected Result field at test case level
    // {
    //   name: 'expectedResult',
    //   label: '期待結果',
    //   type: 'textarea-with-attachments',
    //   placeholder: '期待結果を入力',
    //   rows: 3,
    //   cols: 1,
    //   attachments: expectedResultAttachments,
    //   onAttachmentsChange: setExpectedResultAttachments,
    // },
    {
      name: 'preconditions',
      label: '事前条件',
      type: 'textarea-with-attachments',
      placeholder: '事前条件を入力',
      rows: 3,
      cols: 1,
      attachments: preconditionsAttachments,
      onAttachmentsChange: setPreconditionsAttachments,
    },
    {
      name: 'postconditions',
      label: '事後条件',
      type: 'textarea-with-attachments',
      placeholder: '事後条件を入力',
      rows: 3,
      cols: 1,
      attachments: postconditionsAttachments,
      onAttachmentsChange: setPostconditionsAttachments,
    },
    {
      name: 'testData',
      label: 'テストデータ',
      type: 'textarea',
      placeholder: 'テストデータまたは入力値を入力',
      rows: 3,
      cols: 1,
    },
  ];

  const uploadPendingAttachments = async (): Promise<Array<{ id?: string; s3Key: string; fileName: string; mimeType: string; fieldName?: string }>> => {
    const allAttachments = [
      ...descriptionAttachments,
      // TODO: Uncomment for future use - Expected Result attachments
      // ...expectedResultAttachments,
      ...preconditionsAttachments,
      ...postconditionsAttachments,
    ];

    const pendingAttachments = allAttachments.filter((att) => att.id.startsWith('pending-'));
    
    if (pendingAttachments.length === 0) {
      return []; // No pending attachments
    }

    const uploadedAttachments: Array<{ id?: string; s3Key: string; fileName: string; mimeType: string; fieldName?: string }> = [];

    // Upload all pending files
    for (const attachment of pendingAttachments) {
      // @ts-expect-error - Access the pending file object
      const file = attachment._pendingFile;
      if (!file) continue;

      try {
        const result = await uploadFileToS3({
          file,
          fieldName: attachment.fieldName || 'attachment',
          entityType: 'testcase',
          projectId,
          onProgress: () => {}, // Silent upload
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Store the uploaded attachment info for linking
        if (result.attachment) {
          uploadedAttachments.push({
            id: result.attachment.id, // Use the database ID
            s3Key: result.attachment.filename,
            fileName: file.name,
            mimeType: file.type,
            fieldName: attachment.fieldName,
          });
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
        throw error; // Throw error to stop test case creation
      }
    }

    return uploadedAttachments;
  };

  const handleSubmit = async (formData: Record<string, string>) => {
    // Upload all pending attachments first
    const uploadedAttachments = await uploadPendingAttachments();

    const estimatedTime = formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined;

    const response = await fetch(`/api/projects/${projectId}/testcases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description || undefined,
        // TODO: Uncomment for future use - Expected Result at test case level
        // expectedResult: formData.expectedResult || undefined,
        testData: formData.testData || undefined,
        priority: formData.priority,
        status: formData.status,
        estimatedTime,
        preconditions: formData.preconditions || undefined,
        postconditions: formData.postconditions || undefined,
        moduleId: formData.moduleId !== 'none' ? formData.moduleId : undefined,
        domain: formData.domain && formData.domain !== 'none' ? formData.domain : undefined,
        function: formData.function && formData.function !== 'none' ? formData.function : undefined,
        rtcId: formData.rtcId || undefined,
        flowId: formData.flowId || undefined,
        layer: formData.layer && formData.layer !== 'none' ? formData.layer : undefined,
        target: formData.target && formData.target !== 'none' ? formData.target : undefined,
        testType: formData.testType && formData.testType !== 'none' ? formData.testType : undefined,
        automation: formData.automation && formData.automation !== 'none' ? formData.automation : undefined,
        environment: formData.environment && formData.environment !== 'none' ? formData.environment : undefined,
        moduleCategory: formData.moduleCategory && formData.moduleCategory !== 'none' ? formData.moduleCategory : undefined,
        featureCategory: formData.featureCategory && formData.featureCategory !== 'none' ? formData.featureCategory : undefined,
        evidence: formData.evidence || undefined,
        notes: formData.notes || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create test case');
    }

    const createdTestCase = data.data;

    // Associate uploaded attachments with the test case
    if (uploadedAttachments.length > 0) {
      try {
        const attachmentResponse = await fetch(`/api/projects/${projectId}/testcases/${createdTestCase.id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attachments: uploadedAttachments }),
        });
        
        if (!attachmentResponse.ok) {
          const errorData = await attachmentResponse.json();
          console.error('Failed to associate attachments:', errorData);
          throw new Error('Failed to link attachments to test case');
        }
        
        await attachmentResponse.json();

        // TODO: Uncomment for future use - Link expectedResult attachments to first step
        // If there's an expectedResult with attachments, also link them to the first step
        // This follows the same pattern as expectedResult text - it's saved at test case level
        // and displayed in the first step, so attachments should also be associated with the first step
        // const expectedResultAttachmentsToLink = uploadedAttachments.filter(
        //   (att) => att.fieldName === 'expectedResult'
        // );

        // if (expectedResultAttachmentsToLink.length > 0 && formData.expectedResult) {
        //   try {
        //     // Fetch the test case with steps to check if there's a first step
        //     const testCaseResponse = await fetch(`/api/testcases/${createdTestCase.id}`);
        //     if (testCaseResponse.ok) {
        //       const testCaseData = await testCaseResponse.json();
        //       const steps = testCaseData.data?.steps || [];
        //       
        //       // If there's a first step, link expectedResult attachments to it
        //       // This mirrors how expectedResult text is handled - it's shown in the first step
        //       if (steps.length > 0 && steps[0]?.id) {
        //         const firstStepId = steps[0].id;
        //         const stepAttachmentResponse = await fetch(`/api/teststeps/${firstStepId}/attachments`, {
        //           method: 'POST',
        //           headers: { 'Content-Type': 'application/json' },
        //           body: JSON.stringify({ attachments: expectedResultAttachmentsToLink }),
        //         });
        //         
        //         if (!stepAttachmentResponse.ok) {
        //           console.warn('Failed to link expectedResult attachments to first step, but test case attachments are saved');
        //         }
        //       }
        //     }
        //   } catch (error) {
        //     // Non-critical error - attachments are already linked to test case
        //     console.warn('Error linking expectedResult attachments to step:', error);
        //   }
        // }
      } catch (error) {
        console.error('Error associating attachments:', error);
        throw new Error('Failed to link attachments. Test case was created but attachments were not saved.');
      }
    }

    return createdTestCase;
  };

  const config: BaseDialogConfig<TestCase> = {
    title: 'Create Test Case',
    description: 'Add a new test case to this project. Fill in the details to get started.',
    fields,
    submitLabel: 'Create Test Case',
    cancelLabel: 'Cancel',
    triggerOpen: open !== undefined ? open : triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    projectId,
    onSuccess: (testCase) => {
      if (testCase) {
        onTestCaseCreated(testCase);
        // Clear attachments after successful creation
        attachmentStorage.clearAllAttachments();
        attachmentStorage.clearContext();
      }
    },
    submitButtonName: 'Create Test Case Dialog - Create Test Case',
    cancelButtonName: 'Create Test Case Dialog - Cancel',
  };

  return <BaseDialog {...config} />;
}

export type { CreateTestCaseDialogProps };
