# 🚀 Quick Start Guide - New Design System

## Getting Started in 5 Minutes

Your application now has a professional design system. Here's how to start using it immediately:

---

## 1. View the Showcase

**Visit the component showcase to see everything in action:**

```
http://localhost:3000/component-showcase
```

Or navigate to `/component-showcase` in your application.

---

## 2. Basic Usage Examples

### Buttons

```tsx
import Button from '@/components/ui/button';

// Basic button
<Button>Click Me</Button>

// Primary action
<Button variant="primary">Save Changes</Button>

// With loading state
<Button loading={isLoading}>Submit</Button>

// With icon
<Button leftIcon={<PlusIcon />}>Add Item</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

<Card hover>
  <CardHeader>
    <CardTitle subtitle="Optional subtitle">
      My Card Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badges

```tsx
import { Badge, StatusBadge } from '@/components/ui/badge';

// Status badge
<StatusBadge status="active" />

// Custom badge
<Badge variant="success" dot>Online</Badge>
```

### Toast Notifications

```tsx
import { toast } from '@/components/ui/toaster';

// Success notification
toast.success('Saved!', 'Your changes have been saved');

// Error notification
toast.error('Failed', 'Something went wrong');

// Loading with promise
toast.promise(
  saveData(),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Failed to save'
  }
);
```

### Tables

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow hoverable>
      <TableCell>John Doe</TableCell>
      <TableCell><StatusBadge status="active" /></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Loading States

```tsx
import { SkeletonTable, SkeletonCard } from '@/components/ui/skeleton';

{loading ? (
  <SkeletonTable rows={5} columns={4} />
) : (
  <YourTable data={data} />
)}
```

### Empty States

```tsx
import { NoDataEmptyState } from '@/components/ui/empty-state';

{items.length === 0 && (
  <NoDataEmptyState 
    title="No items yet"
    description="Get started by adding your first item"
    action={{
      label: "Add Item",
      onClick: handleAdd,
      variant: "primary"
    }}
  />
)}
```

### Dialogs

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogClose onClick={() => setOpen(false)} />
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <DialogBody>
      Are you sure?
    </DialogBody>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Inputs

```tsx
import { Input, SearchInput } from '@/components/ui/input';

// Basic input with label
<Input 
  label="Email" 
  placeholder="Enter email"
  required
  helperText="We'll never share your email"
/>

// Input with error
<Input 
  label="Password"
  type="password"
  error
  errorMessage="Password is required"
/>

// Search input
<SearchInput 
  placeholder="Search..." 
  onClear={() => setSearch('')}
/>
```

---

## 3. Using Animations

Add these classes to any element for smooth animations:

```tsx
// Slide in from top
<div className="animate-slide-in-top">Content</div>

// Fade in
<div className="animate-fade-in">Content</div>

// Scale in
<div className="animate-scale-in">Content</div>

// Slide in from bottom
<div className="animate-slide-in-bottom">Content</div>

// Slide in from left
<div className="animate-slide-in-left">Content</div>

// Slide in from right
<div className="animate-slide-in-right">Content</div>
```

---

## 4. Design Patterns

### Loading Pattern

```tsx
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);

return (
  <Card>
    <CardHeader>
      <CardTitle>Users</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <SkeletonTable rows={5} columns={3} />
      ) : data.length === 0 ? (
        <NoDataEmptyState />
      ) : (
        <Table>
          {/* Your table content */}
        </Table>
      )}
    </CardContent>
  </Card>
);
```

### Form Submission Pattern

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    await saveData();
    toast.success('Success!', 'Data saved successfully');
  } catch (error) {
    toast.error('Error', error.message);
  } finally {
    setLoading(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <Input label="Name" required />
    <Button type="submit" loading={loading}>
      Submit
    </Button>
  </form>
);
```

### Confirmation Dialog Pattern

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);

const handleDelete = async () => {
  await deleteItem();
  setConfirmOpen(false);
  toast.success('Deleted', 'Item deleted successfully');
};

return (
  <>
    <Button 
      variant="destructive" 
      onClick={() => setConfirmOpen(true)}
    >
      Delete
    </Button>
    
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <DialogBody>
          Are you sure you want to delete this item?
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
```

---

## 5. Best Practices

### ✅ DO:
- Use loading states for async operations
- Show empty states instead of blank screens
- Provide toast feedback for user actions
- Use proper button variants (primary for main actions)
- Add hover effects to clickable cards
- Use badges for status indicators
- Animate page transitions with CSS classes

### ❌ DON'T:
- Mix different animation styles randomly
- Overuse primary buttons (one per section)
- Skip loading states
- Forget error messages on forms
- Use destructive variant for non-destructive actions

---

## 6. Color Coding Guide

- **Blue** (Primary) - Main actions, links, info
- **Green** (Success) - Success messages, active states
- **Red** (Error) - Errors, destructive actions, alerts
- **Amber** (Warning) - Warnings, pending states
- **Gray** (Secondary) - Secondary actions, disabled states

---

## 7. Responsive Design

All components are responsive by default. Key breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Components automatically adapt:
- Tables scroll horizontally on mobile
- Dialogs adjust to screen size
- Buttons stack on small screens
- Cards are full-width on mobile

---

## 8. Accessibility

All components follow accessibility best practices:

- ✓ Keyboard navigation (Tab, Enter, Escape)
- ✓ Focus indicators on all interactive elements
- ✓ ARIA labels where appropriate
- ✓ Color contrast meets WCAG AA standards
- ✓ Screen reader compatible

---

## 9. Performance Tips

- Use skeleton loaders for perceived performance
- Lazy load heavy components
- Debounce search inputs
- Optimize images and assets
- Keep animations under 300ms

---

## 10. Next Steps

1. **Explore the showcase** at `/component-showcase`
2. **Replace existing components** in your pages
3. **Add loading states** to async operations
4. **Add toast notifications** for user feedback
5. **Use empty states** where appropriate

---

## Need Help?

- Check `DESIGN_SYSTEM_UPGRADE.md` for detailed documentation
- Visit `/component-showcase` for interactive examples
- Review component source code in `src/components/ui/`

**Happy building! 🚀**

