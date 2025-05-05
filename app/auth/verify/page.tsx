"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Token manquant. Impossible de vérifier votre identité.");
      return;
    }
    
    const verifyToken = async () => {
      try {
        // Appeler l'API pour vérifier le token
        const response = await fetch("/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.valid) {
          throw new Error(data.message || "Le token est invalide");
        }
        
        // Extraction de l'email depuis le token décodé
        if (data.user && data.user.email) {
          setEmail(data.user.email);
        }
        
        // Vérification réussie
        setStatus("success");
        setMessage("Connexion réussie! Vous allez être redirigé...");
        
        // Rediriger vers la page d'accueil après un court délai
        setTimeout(() => {
          router.push("/");
        }, 2000);
        
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Le lien est invalide ou a expiré. Veuillez demander un nouveau lien de connexion.");
      }
    };
    
    verifyToken();
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
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
        
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Vérification du lien
        </h1>
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Vérification en cours...</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="p-4 bg-green-50 rounded-md">
            <div className="flex items-center justify-center text-green-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700">{message}</p>
            {email && <p className="text-gray-600 mt-2">Connecté en tant que : {email}</p>}
          </div>
        )}
        
        {status === "error" && (
          <div className="p-4 bg-red-50 rounded-md">
            <div className="flex items-center justify-center text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-700">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 