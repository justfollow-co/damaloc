"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dashboardLink, setDashboardLink] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les messages
    setMessage("");
    setError("");
    setDashboardLink("");
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/send-login-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }
      
      setMessage("Un lien de connexion a été envoyé à votre adresse email.");
      
      // En mode développement, l'API peut renvoyer le token pour faciliter les tests
      if (data.token && data.dashboardLink) {
        setMessage("Un lien de connexion a été généré. Pour cette démonstration, vous pouvez utiliser le lien ci-dessous.");
        setDashboardLink(data.dashboardLink);
      }
      
      setEmail("");
      
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi du lien de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-10 relative">
            <Image
              src="/next.svg"
              alt="Logo"
              fill
              className="object-contain dark:invert"
              priority
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Connexion
        </h1>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
              isSubmitting || !email
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Envoi en cours..." : "Recevoir un lien de connexion"}
          </button>
        </form>
        
        {dashboardLink && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-gray-600 mb-2 font-medium">Démonstration uniquement :</p>
            <a
              href={dashboardLink}
              className="block w-full py-2 px-4 text-center rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
            >
              Accéder au tableau de bord (démo)
            </a>
            <p className="text-xs text-gray-500 mt-1">
              * Dans une vraie application, ce lien serait envoyé par email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
