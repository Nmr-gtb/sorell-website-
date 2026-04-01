export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#005058] animate-spin" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chargement...
        </p>
      </div>
    </div>
  );
}
