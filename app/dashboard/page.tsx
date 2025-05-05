"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Reservation {
  id: string;
  vehicule: string;
  modele: string;
  dateDebut: string;
  dateFin: string;
  client: string;
  email: string;
  statut: "confirmé" | "en attente" | "terminé";
}

const fakeReservations: Reservation[] = [
  {
    id: "RES-2023-001",
    vehicule: "Renault",
    modele: "Clio V",
    dateDebut: "2023-11-15",
    dateFin: "2023-11-20",
    client: "Martin Dupont",
    email: "martin@example.com",
    statut: "confirmé"
  },
  {
    id: "RES-2023-002",
    vehicule: "Peugeot",
    modele: "208",
    dateDebut: "2023-12-01",
    dateFin: "2023-12-07",
    client: "Sophie Durand",
    email: "sophie@example.com",
    statut: "en attente"
  },
  {
    id: "RES-2023-003",
    vehicule: "Citroën",
    modele: "C3",
    dateDebut: "2023-10-20",
    dateFin: "2023-10-25",
    client: "Jean Lefebvre",
    email: "jean@example.com",
    statut: "terminé"
  }
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      console.error("Token manquant dans l'URL");
      router.push("/login");
      return;
    }
    
    const verifyTokenAndLoadData = async () => {
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
          throw new Error(data.message || "Token invalide");
        }
        
        // Extraire l'email de l'utilisateur
        const email = data.user?.email;
        if (!email) {
          throw new Error("Données utilisateur incomplètes");
        }
        
        setUserEmail(email);
        
        // Simuler le chargement des réservations
        // Dans une application réelle, vous récupéreriez les réservations de l'utilisateur depuis une API
        await new Promise(resolve => setTimeout(resolve, 800)); // Simuler un délai de chargement
        
        // Filtrer les réservations pour correspondre à l'email (simulé)
        // Dans une vraie application, cette logique serait côté serveur
        const userReservations = fakeReservations.filter(r => {
          // Pour la démonstration, on retourne toutes les réservations
          return true;
        });
        
        setReservations(userReservations);
        setIsLoading(false);
        
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        router.push("/login");
      }
    };
    
    verifyTokenAndLoadData();
  }, [router, searchParams]);
  
  const getStatusColor = (statut: Reservation["statut"]) => {
    switch (statut) {
      case "confirmé":
        return "bg-green-100 text-green-800";
      case "en attente":
        return "bg-yellow-100 text-yellow-800";
      case "terminé":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            {userEmail && (
              <p className="text-sm text-gray-600">Connecté en tant que: {userEmail}</p>
            )}
          </div>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Déconnexion
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Vos réservations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.vehicule} {reservation.modele}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Du {new Date(reservation.dateDebut).toLocaleDateString('fr-FR')} au {new Date(reservation.dateFin).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.client}<br />
                      <span className="text-xs text-gray-400">{reservation.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.statut)}`}>
                        {reservation.statut}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      Aucune réservation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 