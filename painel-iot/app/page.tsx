export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F6FAFD] p-8 font-sans">
      {/* Cabeçalho */}
      <header className="mb-8 flex justify-between items-center bg-[#1A3D63] p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">VoltGuard</h1>
          <p className="text-[#B3CFE5] mt-1 text-sm">Sistema de Monitoramento Elétrico Residencial</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-[#B3CFE5] font-medium">ESP32 Online</span>
        </div>
      </header>

      {/* Grid de Disjuntores (Mock visual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Disjuntor Geral */}
        <div className="bg-white border-2 border-[#B3CFE5] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#0A1931] uppercase">Geral</h2>
            <span className="bg-[#4A7FA7] text-white text-xs px-2 py-1 rounded">30A Max</span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">Corrente: <span className="font-bold text-[#1A3D63] text-lg">12.5 A</span></p>
            <p className="text-gray-600">Potência: <span className="font-bold text-[#1A3D63] text-lg">1593 W</span></p>
          </div>
        </div>

        {/* Card Ar-Condicionado */}
        <div className="bg-white border-2 border-[#B3CFE5] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#0A1931] uppercase">Ar-Condicionado</h2>
            <span className="bg-[#4A7FA7] text-white text-xs px-2 py-1 rounded">15A Max</span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">Corrente: <span className="font-bold text-[#1A3D63] text-lg">6.2 A</span></p>
            <p className="text-gray-600">Potência: <span className="font-bold text-[#1A3D63] text-lg">790 W</span></p>
          </div>
        </div>

        {/* Card de Alerta (Exemplo visual de sobrecarga) */}
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-700 uppercase">Chuveiro</h2>
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              ⚠️ ALERTA
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-red-900">Corrente: <span className="font-bold text-red-600 text-lg">22.5 A</span> (Limite: 20A)</p>
            <p className="text-red-900">Potência: <span className="font-bold text-red-600 text-lg">2868 W</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}