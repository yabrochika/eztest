'use client';

import * as React from 'react';
import { Shield, Eye, Users, LucideIcon } from 'lucide-react';

/**
 * Get the badge color class for a role
 */
export function getRoleBadgeColor(roleName: string): string {
  switch (roleName) {
    case 'ADMIN':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'PROJECT_MANAGER':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'TESTER':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'VIEWER':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default:
      return 'bg-white/10 text-white border-white/20';
  }
}

/**
 * Get the icon component for a role
 */
export function getRoleIcon(roleName: string): React.ReactNode {
  switch (roleName) {
    case 'ADMIN':
    case 'PROJECT_MANAGER':
      return <Shield className="w-3 h-3" />;
    case 'VIEWER':
      return <Eye className="w-3 h-3" />;
    default:
      return <Users className="w-3 h-3" />;
  }
}

/**
 * Get the icon component as a LucideIcon for a role
 */
export function getRoleIconComponent(roleName: string): LucideIcon {
  switch (roleName) {
    case 'ADMIN':
    case 'PROJECT_MANAGER':
      return Shield;
    case 'VIEWER':
      return Eye;
    default:
      return Users;
  }
}

