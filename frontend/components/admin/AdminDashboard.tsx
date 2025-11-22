'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/elements/card';
import { Breadcrumbs } from '@/components/design/Breadcrumbs';
import { Button } from '@/elements/button';
import { Users } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="flex-1">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Breadcrumbs
            items={[
              { label: 'Admin' },
            ]}
          />
          <form action="/api/auth/signout" method="POST" className="inline">
            <Button type="submit" variant="glass-destructive" size="sm" className="px-5">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70">
            Manage application users and access control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link href="/admin/users">
            <Card variant="glass" className="hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">User Management</CardTitle>
                </div>
                <CardDescription>
                  Add, edit, and manage application users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">
                  Manage user accounts and assign application-level roles
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
