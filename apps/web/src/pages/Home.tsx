import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Home() {
  const [status, setStatus] = useState("");

  // Check backend health
  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch((err) => {
        console.error("Health check failed:", err);
        setStatus("error");
      });
  }, []);
  const testProtected = async () => {
    try {
      const res = await api.get("/api/protected/tester");
      alert(res.data.message);
    } catch (err) {
      alert("Access denied (Are you logged in as TESTER?)");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">
          TestTrack Pro 🚀
        </h1>

        <p className="text-gray-600">
          Backend Status:
        </p>

        <p className={`mt-2 font-semibold ${status === "ok" ? "text-green-600" : "text-red-600"}`}>
          {status}
        </p>

        <button
          onClick={testProtected}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Test Protected Route
        </button>
      </div>
    </div>
  );
}