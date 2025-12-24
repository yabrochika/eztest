'use client';

import { useState } from 'react';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/frontend/reusable-elements/hover-cards/HoverCard';
import { Trash2, Bug, ChevronDown } from 'lucide-react';
import { PriorityBadge } from '@/frontend/reusable-components/badges/PriorityBadge';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { TestCase, Module } from '@/frontend/components/testcase/types';

interface TestSuiteTestCaseTableProps {
  testCases: TestCase[];
  modules?: Module[];
  onDelete?: (testCase: TestCase) => void;
  onClick: (testCaseId: string) => void;
  canDelete?: boolean;
}

/**
 * Test case table component specifically for test suite detail page
 * Has groups expanded by default and horizontal scrolling support
 */
export function TestSuiteTestCaseTable({
  testCases,
  modules = [],
  onDelete,
  onClick,
  canDelete = true,
}: TestSuiteTestCaseTableProps) {
  // Initialize with all groups expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>();
    testCases.forEach((tc) => {
      const groupId = tc.moduleId || 'no-module';
      groups.add(groupId);
    });
    modules.forEach((m) => groups.add(m.id));
    return groups;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DEPRECATED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Group test cases by module
  const groupedData: Record<string, { items: TestCase[]; name: string; count: number }> = {};
  
  testCases.forEach((tc) => {
    const groupId = tc.moduleId || 'no-module';
    if (!groupedData[groupId]) {
      const moduleName = modules.find((m) => m.id === groupId)?.name || 'Ungrouped';
      groupedData[groupId] = {
        items: [],
        name: moduleName,
        count: 0,
      };
    }
    groupedData[groupId].items.push(tc);
  });

  // Add empty modules
  modules.forEach((m) => {
    if (!groupedData[m.id]) {
      groupedData[m.id] = {
        items: [],
        name: m.name,
        count: m._count?.testCases || 0,
      };
    } else {
      groupedData[m.id].count = m._count?.testCases || groupedData[m.id].items.length;
    }
  });

  // Set counts for groups
  Object.keys(groupedData).forEach((groupId) => {
    if (groupedData[groupId].count === 0) {
      groupedData[groupId].count = groupedData[groupId].items.length;
    }
  });

  const gridColumns = "70px 1fr 100px 90px 140px 70px 40px";

  return (
    <div className="w-full">
      {/* Header */}
      <div
        className="grid gap-3 px-3 py-1.5 text-xs font-semibold text-white/60 border-b border-white/10"
        style={{ gridTemplateColumns: gridColumns }}
      >
        <div>ID</div>
        <div>TITLE</div>
        <div>PRIORITY</div>
        <div>STATUS</div>
        <div>OWNER</div>
        <div>RUNS</div>
        <div></div>
      </div>

      {/* Grouped content */}
      <div className="space-y-2">
        {Object.entries(groupedData).map(([groupId, { items, name, count }]) => {
          const isExpanded = expandedGroups.has(groupId);

          return (
            <div key={groupId} className="space-y-1">
              {/* Group header */}
              <div className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 border-b border-white/10 rounded transition-colors">
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white/60 transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="text-sm font-semibold text-white/80">{name}</span>
                </button>
                <span className="text-xs text-white/50">
                  ({count} item{count !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Group rows */}
              {isExpanded && items.length > 0 && (
                <div className="space-y-0.5">
                  {items.map((testCase) => {
                    const actionItems = onDelete && canDelete ? [
                      {
                        label: 'Delete',
                        icon: Trash2,
                        onClick: () => onDelete(testCase),
                        variant: 'destructive' as const,
                      },
                    ] : [];

                    return (
                      <div
                        key={testCase.id}
                        className="grid gap-3 px-3 py-1.5 rounded hover:bg-white/5 border-b border-white/10 hover:border-blue-500/30 cursor-pointer transition-colors items-center text-sm"
                        style={{ gridTemplateColumns: gridColumns }}
                        onClick={() => onClick(testCase.id)}
                      >
                          {/* ID */}
                          <div>
                            <p className="text-xs font-mono text-white/70 truncate">{testCase.tcId}</p>
                          </div>

                          {/* Title */}
                          <div className="min-w-0 flex items-center gap-2">
                            <HoverCard openDelay={200}>
                              <HoverCardTrigger asChild>
                                <p className="text-sm font-medium text-white truncate cursor-pointer flex-1">
                                  {testCase.title}
                                </p>
                              </HoverCardTrigger>
                              {testCase.title && testCase.title.length > 40 && (
                                <HoverCardContent side="top" className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-white">Test Case Title</h4>
                                    <p className="text-sm text-white/80 break-words">{testCase.title}</p>
                                    {testCase._count.defects > 0 && (
                                      <div className="pt-2 border-t border-white/10">
                                        <p className="text-xs text-red-400">
                                          {testCase._count.defects} open defect{testCase._count.defects !== 1 ? 's' : ''}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </HoverCardContent>
                              )}
                            </HoverCard>
                            {testCase._count.defects > 0 && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded border border-red-500/30 flex-shrink-0">
                                <Bug className="w-3 h-3 text-red-400" />
                                <span className="text-xs text-red-400 font-medium">{testCase._count.defects}</span>
                              </div>
                            )}
                          </div>

                          {/* Priority */}
                          <div>
                            <PriorityBadge
                              priority={
                                testCase.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'
                              }
                            />
                          </div>

                          {/* Status */}
                          <div>
                            <Badge
                              variant="outline"
                              className={`w-fit text-xs px-2 py-0.5 ${getStatusColor(testCase.status)}`}
                            >
                              {testCase.status}
                            </Badge>
                          </div>

                          {/* Owner */}
                          <div className="min-w-0">
                            <HoverCard openDelay={200}>
                              <HoverCardTrigger asChild>
                                <span className="text-xs text-white/70 truncate block cursor-pointer">
                                  {testCase.createdBy.name}
                                </span>
                              </HoverCardTrigger>
                              {testCase.createdBy.name && testCase.createdBy.name.length > 20 && (
                                <HoverCardContent side="top" className="w-60">
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-white/60">Owner</h4>
                                    <p className="text-sm text-white/90">{testCase.createdBy.name}</p>
                                  </div>
                                </HoverCardContent>
                              )}
                            </HoverCard>
                          </div>

                          {/* Runs */}
                          <div>
                            <span className="text-xs text-white/60">{testCase._count.results}</span>
                          </div>

                        {/* Actions */}
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          {actionItems.length > 0 && (
                            <ActionMenu
                              items={actionItems}
                              align="end"
                              iconSize="w-3 h-3"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

