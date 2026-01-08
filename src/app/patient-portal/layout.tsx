import { Toaster } from "@/components/ui/toaster";

export default function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Patient portal has its own authentication
  // No AuthWrapper needed - completely isolated from staff system
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

