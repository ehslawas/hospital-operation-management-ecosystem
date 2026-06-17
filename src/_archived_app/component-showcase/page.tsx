"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, SearchInput } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonForm } from '@/components/ui/skeleton';
import { EmptyState, NoDataEmptyState, SearchEmptyState, ErrorEmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/toaster';

export default function ComponentShowcasePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Action completed!', 'Your changes have been saved successfully.');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="animate-slide-in-top">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Component Showcase</h1>
        <p className="text-gray-600">Enhanced UI components with modern styling and animations</p>
      </div>

      {/* Buttons Section */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Various button styles with loading states and icons">Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Button Variants */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">States & Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>With Left Icon</Button>
                <Button variant="primary" rightIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>With Right Icon</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Status indicators and labels">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Badge Variants */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="default">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="default">Success</Badge>
                <Badge variant="secondary">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="secondary">Info</Badge>
                <Badge variant="outline">Purple</Badge>
                <Badge variant="outline">Pink</Badge>
              </div>
            </div>

            {/* Badge with Dot */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">With Indicators</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Active</Badge>
                <Badge variant="secondary">Pending</Badge>
                <Badge variant="destructive">Failed</Badge>
                <Badge variant="outline">Outline Style</Badge>
                <Badge>5</Badge>
                <Badge>99+</Badge>
              </div>
            </div>

            {/* Status Badges */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Badges</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Active</Badge>
                <Badge variant="secondary">Inactive</Badge>
                <Badge variant="secondary">Pending</Badge>
                <Badge variant="default">Completed</Badge>
                <Badge variant="destructive">Cancelled</Badge>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inputs Section */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Form inputs with icons and validation">Input Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <Input 
              label="Full Name" 
              placeholder="Enter your name" 
              required
              helperText="This field is required"
            />
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="email@example.com"
              leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              error
              errorMessage="Password must be at least 8 characters"
            />
            <SearchInput placeholder="Search items..." />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="animate-slide-in-bottom">
        <CardHeader>
          <CardTitle subtitle="Data table with sorting and styling">Table Example</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow index={0} hoverable>
                <TableCell>John Doe</TableCell>
                <TableCell><Badge variant="default">Active</Badge></TableCell>
                <TableCell>Administrator</TableCell>
                <TableCell align="right">
                  <Button size="sm" variant="ghost">Edit</Button>
                </TableCell>
              </TableRow>
              <TableRow index={1} hoverable>
                <TableCell>Jane Smith</TableCell>
                <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                <TableCell>Pharmacist</TableCell>
                <TableCell align="right">
                  <Button size="sm" variant="ghost">Edit</Button>
                </TableCell>
              </TableRow>
              <TableRow index={2} hoverable>
                <TableCell>Bob Johnson</TableCell>
                <TableCell><Badge variant="secondary">Inactive</Badge></TableCell>
                <TableCell>Staff</TableCell>
                <TableCell align="right">
                  <Button size="sm" variant="ghost">Edit</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Skeleton loaders for better UX">Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Card Skeleton</h4>
              <SkeletonCard />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Form Skeleton</h4>
              <SkeletonForm fields={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Informative empty state components">Empty States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <NoDataEmptyState 
              action={{
                label: "Add Item",
                onClick: () => toast.info("Add item clicked"),
                variant: "primary"
              }}
            />
            <SearchEmptyState searchTerm="medical supplies" />
            <ErrorEmptyState 
              action={{
                label: "Try Again",
                onClick: () => toast.info("Retry clicked"),
                variant: "primary"
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Toast notifications for user feedback">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => toast.success('Success!', 'Operation completed successfully')}>
              Success Toast
            </Button>
            <Button variant="destructive" onClick={() => toast.error('Error!', 'Something went wrong')}>
              Error Toast
            </Button>
            <Button variant="warning" onClick={() => toast.warning('Warning!', 'Please review your input')}>
              Warning Toast
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Info', 'Here is some information')}>
              Info Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Section */}
      <Card className="animate-slide-in-bottom" hover>
        <CardHeader>
          <CardTitle subtitle="Modal dialogs with animations">Dialogs</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setDialogOpen(true)} variant="primary">
            Open Dialog
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogClose onClick={() => setDialogOpen(false)} />
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogDescription>
                  Are you sure you want to proceed with this action? This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <p className="text-sm text-gray-600">
                  This is the dialog body where you can add any content, forms, or information.
                </p>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleAsyncAction}
                  loading={loading}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Design Tips */}
      <Card className="animate-slide-in-bottom border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>🎨 Design System Ready!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              Your application now has a comprehensive, modern design system with:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Enhanced animations</strong> - Smooth transitions and micro-interactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Loading states</strong> - Skeleton loaders for better UX</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Empty states</strong> - Informative placeholders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Toast notifications</strong> - User feedback system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Improved accessibility</strong> - Better focus states and ARIA labels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Design tokens</strong> - Consistent spacing, colors, and animations</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Pro Tip:</strong> Use these components throughout your app for a consistent, professional look. 
                All components are fully typed with TypeScript and follow accessibility best practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



