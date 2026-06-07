export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
      <div className="w-8 h-8 border-4 border-[#0f2d5e] border-t-transparent rounded-full animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
