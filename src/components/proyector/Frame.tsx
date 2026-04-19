export function ProjectorFrame({
  nombre,
  children,
}: {
  nombre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-6 border-b border-gray-100">
        <h1 className="text-3xl font-semibold text-sb-azul">{nombre}</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-12">{children}</main>
    </div>
  );
}
