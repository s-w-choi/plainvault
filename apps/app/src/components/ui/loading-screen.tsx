export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
