export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/logo.png" 
        alt="Axion Logo" 
        className="h-7 w-auto"
      />
      <span className="text-white font-semibold text-xl">Axion</span>
    </div>
  );
}
