import { useEffect, useState } from "react";
import { api } from "../services/api";
import { CheckCircle2, XCircle, Shield } from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("error"));
  }, []);

  const testProtected = async () => {
    try {
      const res = await api.get("/api/protected/tester");
      alert(res.data.message);
    } catch {
      alert("Access denied (Are you logged in as TESTER?)");
    }
  };

  const isOk = status === "ok";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-10 bg-slate-900 border border-slate-800 shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] rounded-2xl p-10 w-96 text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TestTrack Pro 🚀</h1>
          <p className="text-slate-400 text-sm mt-1">Quality assurance platform</p>
        </div>

        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${
          isOk
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : status
            ? 'bg-red-500/10 border-red-500/20 text-red-300'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}>
          {isOk
            ? <><CheckCircle2 className="h-4 w-4" /> API Online</>
            : status === 'error'
            ? <><XCircle className="h-4 w-4" /> API Offline</>
            : <span className="animate-pulse">Checking API…</span>
          }
        </div>

        <button
          onClick={testProtected}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-900/30 text-sm"
        >
          <Shield className="h-4 w-4" />
          Test Protected Route
        </button>
      </div>
    </div>
  );
}