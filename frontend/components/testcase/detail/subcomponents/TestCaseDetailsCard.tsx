'use client';

import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Clock } from 'lucide-react';
import { TestCase, TestCaseFormData, Module } from '../../types';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Input } from '@/frontend/reusable-elements/inputs/Input';
import { TextareaWithAttachments } from '@/frontend/reusable-elements/textareas/TextareaWithAttachments';
import { Textarea } from '@/frontend/reusable-elements/textareas/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/reusable-elements/selects/Select';
import { type Attachment } from '@/lib/s3';
import { AttachmentDisplay } from '@/frontend/reusable-components/attachments/AttachmentDisplay';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

interface TestCaseDetailsCardProps {
  testCase: TestCase;
  isEditing: boolean;
  formData: TestCaseFormData;
  errors?: Record<string, string>;
  modules?: Module[];
  onFormChange: (data: TestCaseFormData) => void;
  onFieldChange?: (field: keyof TestCaseFormData, value: string | number | boolean | null) => void;
  projectId?: string;
  // Attachments
  descriptionAttachments?: Attachment[];
  expectedResultAttachments?: Attachment[];
  preconditionAttachments?: Attachment[];
  postconditionAttachments?: Attachment[];
  onDescriptionAttachmentsChange?: (attachments: Attachment[]) => void;
  onExpectedResultAttachmentsChange?: (attachments: Attachment[]) => void;
  onPreconditionAttachmentsChange?: (attachments: Attachment[]) => void;
  onPostconditionAttachmentsChange?: (attachments: Attachment[]) => void;
}

export function TestCaseDetailsCard({
  testCase,
  isEditing,
  formData,
  errors = {},
  modules = [],
  onFormChange,
  onFieldChange,
  projectId,
  descriptionAttachments = [],
  expectedResultAttachments = [],
  preconditionAttachments = [],
  postconditionAttachments = [],
  onDescriptionAttachmentsChange,
  onExpectedResultAttachmentsChange,
  onPreconditionAttachmentsChange,
  onPostconditionAttachmentsChange,
}: TestCaseDetailsCardProps) {
  // Fetch dynamic dropdown options
  const { options: priorityOptions, loading: loadingPriority } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptions, loading: loadingStatus } = useDropdownOptions('TestCase', 'status');
  const { options: layerOptions, loading: loadingLayer } = useDropdownOptions('TestCase', 'layer');
  const { options: targetOptions, loading: loadingTarget } = useDropdownOptions('TestCase', 'target');
  const { options: testTypeOptions, loading: loadingTestType } = useDropdownOptions('TestCase', 'testType');
  const { options: automationOptions, loading: loadingAutomation } = useDropdownOptions('TestCase', 'automation');
  const { options: environmentOptions, loading: loadingEnvironment } = useDropdownOptions('TestCase', 'environment');
  const { options: moduleCategoryOptions, loading: loadingModuleCategory } = useDropdownOptions('TestCase', 'moduleCategory');
  const { options: featureCategoryOptions, loading: loadingFeatureCategory } = useDropdownOptions('TestCase', 'featureCategory');

  const handleFieldChange = onFieldChange || ((field, value) => {
    onFormChange({ ...formData, [field]: value });
  });

  // Create safe attachment handlers with default no-op functions
  const handleDescriptionAttachmentsChange = onDescriptionAttachmentsChange || (() => {});
  const handleExpectedResultAttachmentsChange = onExpectedResultAttachmentsChange || (() => {});
  const handlePreconditionAttachmentsChange = onPreconditionAttachmentsChange || (() => {});
  const handlePostconditionAttachmentsChange = onPostconditionAttachmentsChange || (() => {});

  return (
    <DetailCard title="詳細" contentClassName="space-y-4">
      {isEditing ? (
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              variant="glass"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter test case title"
              maxLength={200}
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleFieldChange('priority', value)}
              >
                <SelectTrigger variant="glass" id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent variant="glass">
                  {loadingPriority ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    priorityOptions.map((opt) => (
                      <SelectItem 
                        key={opt.id} 
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <SelectTrigger variant="glass" id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent variant="glass">
                  {loadingStatus ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    statusOptions.map((opt) => (
                      <SelectItem 
                        key={opt.id} 
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Module */}
          <div className="space-y-2">
            <Label htmlFor="moduleId">Module</Label>
            <Select
              value={formData.moduleId || 'none'}
              onValueChange={(value) => handleFieldChange('moduleId', value === 'none' ? null : value)}
            >
              <SelectTrigger variant="glass" id="moduleId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent variant="glass">
                <SelectItem value="none">None (No Module)</SelectItem>
                {modules?.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2 pt-6 mt-6 border-t border-white/10">
            <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
            <Input
              id="estimatedTime"
              variant="glass"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => handleFieldChange('estimatedTime', e.target.value)}
              placeholder="Enter estimated time"
              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
          </div>

          {/* Description with Attachments */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <TextareaWithAttachments
              fieldName="description"
              variant="glass"
              value={formData.description}
              onChange={(value) => handleFieldChange('description', value)}
              placeholder="Enter test case description"
              rows={3}
              maxLength={250}
              showCharCount={true}
              attachments={descriptionAttachments}
              onAttachmentsChange={handleDescriptionAttachmentsChange}
              entityType="testcase"
              projectId={projectId}
              showAttachments={true}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* Preconditions with Attachments */}
          <div className="space-y-2">
            <Label htmlFor="preconditions">Preconditions</Label>
            <TextareaWithAttachments
              fieldName="preconditions"
              variant="glass"
              value={formData.preconditions}
              onChange={(value) => handleFieldChange('preconditions', value)}
              placeholder="Enter preconditions"
              rows={3}
              maxLength={250}
              showCharCount={true}
              attachments={preconditionAttachments}
              onAttachmentsChange={handlePreconditionAttachmentsChange}
              entityType="testcase"
              projectId={projectId}
              showAttachments={true}
            />
          </div>

          {/* Postconditions with Attachments */}
          <div className="space-y-2">
            <Label htmlFor="postconditions">Postconditions</Label>
            <TextareaWithAttachments
              fieldName="postconditions"
              variant="glass"
              value={formData.postconditions}
              onChange={(value) => handleFieldChange('postconditions', value)}
              placeholder="Enter postconditions"
              rows={3}
              maxLength={250}
              showCharCount={true}
              attachments={postconditionAttachments}
              onAttachmentsChange={handlePostconditionAttachmentsChange}
              entityType="testcase"
              projectId={projectId}
              showAttachments={true}
            />
          </div>

          {/* Test Data */}
          <div className="space-y-2">
            <Label htmlFor="testData">Test Data</Label>
            <Textarea
              id="testData"
              variant="glass"
              value={formData.testData}
              onChange={(e) => handleFieldChange('testData', e.target.value)}
              placeholder="Enter test data or input values"
              rows={3}
              maxLength={500}
            />
            {errors.testData && <p className="text-xs text-red-400">{errors.testData}</p>}
          </div>

          {/* Additional Fields Section */}
          <div className="border-t border-white/10 pt-6 mt-6">
            <h4 className="text-sm font-medium text-white/60 mb-4">追加情報</h4>
            
            {/* RTC-ID and Flow-ID */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="rtcId">RTC-ID</Label>
                <Input
                  id="rtcId"
                  variant="glass"
                  value={formData.rtcId || ''}
                  onChange={(e) => handleFieldChange('rtcId', e.target.value)}
                  placeholder="RTC-IDを入力"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flowId">Flow-ID</Label>
                <Input
                  id="flowId"
                  variant="glass"
                  value={formData.flowId || ''}
                  onChange={(e) => handleFieldChange('flowId', e.target.value)}
                  placeholder="Flow-IDを入力"
                />
              </div>
            </div>

            {/* Layer and Target */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="layer">レイヤー</Label>
                <Select
                  value={formData.layer || 'none'}
                  onValueChange={(value) => handleFieldChange('layer', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="layer">
                    <SelectValue placeholder="レイヤーを選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingLayer ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      layerOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">対象</Label>
                <Select
                  value={formData.target || 'none'}
                  onValueChange={(value) => handleFieldChange('target', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="target">
                    <SelectValue placeholder="対象を選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingTarget ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      targetOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Test Type and Automation */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="testType">テスト種別</Label>
                <Select
                  value={formData.testType || 'none'}
                  onValueChange={(value) => handleFieldChange('testType', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="testType">
                    <SelectValue placeholder="テスト種別を選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingTestType ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      testTypeOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="automation">自動化</Label>
                <Select
                  value={formData.automation || 'none'}
                  onValueChange={(value) => handleFieldChange('automation', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="automation">
                    <SelectValue placeholder="自動化を選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingAutomation ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      automationOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Environment */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="environment">環境</Label>
                <Select
                  value={formData.environment || 'none'}
                  onValueChange={(value) => handleFieldChange('environment', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="environment">
                    <SelectValue placeholder="環境を選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingEnvironment ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      environmentOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Domain and Feature */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="moduleCategory">ドメイン</Label>
                <Select
                  value={formData.moduleCategory || 'none'}
                  onValueChange={(value) => handleFieldChange('moduleCategory', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="moduleCategory">
                    <SelectValue placeholder="ドメインを選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingModuleCategory ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      moduleCategoryOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featureCategory">機能</Label>
                <Select
                  value={formData.featureCategory || 'none'}
                  onValueChange={(value) => handleFieldChange('featureCategory', value === 'none' ? null : value)}
                >
                  <SelectTrigger variant="glass" id="featureCategory">
                    <SelectValue placeholder="機能を選択" />
                  </SelectTrigger>
                  <SelectContent variant="glass">
                    <SelectItem value="none">なし</SelectItem>
                    {loadingFeatureCategory ? (
                      <SelectItem value="loading" disabled>読込中...</SelectItem>
                    ) : (
                      featureCategoryOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evidence Code */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="evidence">根拠コード</Label>
              <Input
                id="evidence"
                variant="glass"
                value={formData.evidence || ''}
                onChange={(e) => handleFieldChange('evidence', e.target.value)}
                placeholder="根拠コードを入力"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                variant="glass"
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="備考を入力"
                rows={3}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Module, Domain, Feature row */}
          {(testCase.module || testCase.moduleCategory || testCase.featureCategory) && (
            <div className="grid grid-cols-3 gap-4">
              {testCase.module && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-1">
                    モジュール
                  </h4>
                  <p className="text-white/90">{testCase.module.name}</p>
                </div>
              )}
              {testCase.moduleCategory && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-1">
                    ドメイン
                  </h4>
                  <p className="text-white/90">{testCase.moduleCategory}</p>
                </div>
              )}
              {testCase.featureCategory && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-1">
                    機能
                  </h4>
                  <p className="text-white/90">{testCase.featureCategory}</p>
                </div>
              )}
            </div>
          )}

          {(testCase.description || descriptionAttachments.length > 0) && (
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white/60">
                  説明
                </h4>
                {descriptionAttachments.length > 0 ? (
                  <span className="text-xs text-white/50">{descriptionAttachments.length} 添付ファイル</span>
                ) : (
                  <span className="text-xs text-white/40">添付ファイルなし</span>
                )}
              </div>
              {testCase.description && descriptionAttachments.length > 0 ? (
                <div className="flex gap-4 items-start">
                  <p className="text-white/90 break-words whitespace-pre-wrap flex-1">{testCase.description}</p>
                  <div className="flex-shrink-0">
                    <AttachmentDisplay attachments={descriptionAttachments} />
                  </div>
                </div>
              ) : testCase.description ? (
                <p className="text-white/90 break-words whitespace-pre-wrap">{testCase.description}</p>
              ) : descriptionAttachments.length > 0 ? (
                <div className="flex justify-end">
                  <AttachmentDisplay attachments={descriptionAttachments} />
                </div>
              ) : null}
            </div>
          )}

          {testCase.estimatedTime && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-sm font-medium text-white/60 mb-1">
                見積時間
              </h4>
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="w-4 h-4" />
                <span>{testCase.estimatedTime} 分</span>
              </div>
            </div>
          )}

          {(testCase.preconditions || preconditionAttachments.length > 0) && (
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white/60">
                  事前条件
                </h4>
                {preconditionAttachments.length > 0 ? (
                  <span className="text-xs text-white/50">{preconditionAttachments.length} 添付ファイル</span>
                ) : (
                  <span className="text-xs text-white/40">添付ファイルなし</span>
                )}
              </div>
              {testCase.preconditions && preconditionAttachments.length > 0 ? (
                <div className="flex gap-4 items-start">
                  <p className="text-white/90 whitespace-pre-wrap break-words flex-1">
                    {testCase.preconditions}
                  </p>
                  <div className="flex-shrink-0">
                    <AttachmentDisplay attachments={preconditionAttachments} />
                  </div>
                </div>
              ) : testCase.preconditions ? (
                <p className="text-white/90 whitespace-pre-wrap break-words">
                  {testCase.preconditions}
                </p>
              ) : preconditionAttachments.length > 0 ? (
                <div className="flex justify-end">
                  <AttachmentDisplay attachments={preconditionAttachments} />
                </div>
              ) : null}
            </div>
          )}

          {(testCase.postconditions || postconditionAttachments.length > 0) && (
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white/60">
                  事後条件
                </h4>
                {postconditionAttachments.length > 0 ? (
                  <span className="text-xs text-white/50">{postconditionAttachments.length} 添付ファイル</span>
                ) : (
                  <span className="text-xs text-white/40">添付ファイルなし</span>
                )}
              </div>
              {testCase.postconditions && postconditionAttachments.length > 0 ? (
                <div className="flex gap-4 items-start">
                  <p className="text-white/90 whitespace-pre-wrap break-words flex-1">
                    {testCase.postconditions}
                  </p>
                  <div className="flex-shrink-0">
                    <AttachmentDisplay attachments={postconditionAttachments} />
                  </div>
                </div>
              ) : testCase.postconditions ? (
                <p className="text-white/90 whitespace-pre-wrap break-words">
                  {testCase.postconditions}
                </p>
              ) : postconditionAttachments.length > 0 ? (
                <div className="flex justify-end">
                  <AttachmentDisplay attachments={postconditionAttachments} />
                </div>
              ) : null}
            </div>
          )}

          {testCase.testData && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-sm font-medium text-white/60 mb-2">
                テストデータ
              </h4>
              <p className="text-white/90 whitespace-pre-wrap break-words">
                {testCase.testData}
              </p>
            </div>
          )}

          {/* Additional Fields Section */}
          {(testCase.rtcId || testCase.flowId || testCase.layer || testCase.target || 
            testCase.testType || testCase.automation || testCase.environment || 
            testCase.evidence || testCase.notes) && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-sm font-medium text-white/60 mb-4">
                追加情報
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {testCase.rtcId && (
                  <div>
                    <span className="text-xs text-white/50">RTC-ID</span>
                    <p className="text-sm text-white/90">{testCase.rtcId}</p>
                  </div>
                )}
                {testCase.flowId && (
                  <div>
                    <span className="text-xs text-white/50">Flow-ID</span>
                    <p className="text-sm text-white/90">{testCase.flowId}</p>
                  </div>
                )}
                {testCase.layer && (
                  <div>
                    <span className="text-xs text-white/50">レイヤー</span>
                    <p className="text-sm text-white/90">{testCase.layer}</p>
                  </div>
                )}
                {testCase.target && (
                  <div>
                    <span className="text-xs text-white/50">対象</span>
                    <p className="text-sm text-white/90">{testCase.target}</p>
                  </div>
                )}
                {testCase.testType && (
                  <div>
                    <span className="text-xs text-white/50">テスト種別</span>
                    <p className="text-sm text-white/90">{testCase.testType}</p>
                  </div>
                )}
                {testCase.automation && (
                  <div>
                    <span className="text-xs text-white/50">自動化</span>
                    <p className="text-sm text-white/90">{testCase.automation}</p>
                  </div>
                )}
                {testCase.environment && (
                  <div>
                    <span className="text-xs text-white/50">環境</span>
                    <p className="text-sm text-white/90">{testCase.environment}</p>
                  </div>
                )}
              </div>
              {testCase.evidence && (
                <div className="mt-4">
                  <span className="text-xs text-white/50">根拠コード</span>
                  <p className="text-sm text-white/90">{testCase.evidence}</p>
                </div>
              )}
              {testCase.notes && (
                <div className="mt-4">
                  <span className="text-xs text-white/50">備考</span>
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{testCase.notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DetailCard>
  );
}
