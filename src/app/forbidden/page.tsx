export default function ForbiddenPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-gray-600">You do not have permission to view this page.</p>
      <div className="text-sm text-gray-500">
        For local testing, visit <code>/dev/login?role=pharmacy_logistics</code> then retry.
      </div>
    </div>
  );
}


