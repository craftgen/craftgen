export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-fit flex-col items-center justify-start gap-4 p-4">
      {children}
    </div>
  );
}
