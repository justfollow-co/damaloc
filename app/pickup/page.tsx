"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import SignaturePad from "signature_pad";

interface PhotoFile {
  file: File;
  preview: string;
}

export default function PickupPage() {
  // État pour suivre l'étape actuelle du formulaire
  const [step, setStep] = useState(1);
  // État pour stocker les photos extérieures
  const [exteriorPhotos, setExteriorPhotos] = useState<PhotoFile[]>([]);
  // État pour stocker les photos intérieures
  const [interiorPhotos, setInteriorPhotos] = useState<PhotoFile[]>([]);
  // État pour stocker les coordonnées géographiques
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // État pour stocker le code de vérification
  const [verificationCode, setVerificationCode] = useState("");
  // État pour indiquer si le code est valide
  const [isCodeValid, setIsCodeValid] = useState(false);
  // État pour gérer les erreurs
  const [error, setError] = useState("");
  // État pour indiquer si le formulaire est en cours de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // État pour indiquer si le pickup est terminé
  const [isCompleted, setIsCompleted] = useState(false);
  // État pour stocker l'image de la signature
  const [signatureImage, setSignatureImage] = useState("");
  // État pour indiquer si le PDF est en cours de génération
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Référence pour le canvas de signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Initialiser le pad de signature lorsque le composant est monté
  useEffect(() => {
    if (step === 4 && canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      signaturePadRef.current = new SignaturePad(canvas);
      
      // Ajuster la taille du canvas à celle de son conteneur
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, [step]);

  // Gérer le changement des photos extérieures
  const handleExteriorPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setExteriorPhotos(prev => {
        const updated = [...prev, ...newPhotos];
        // Limiter à 5 photos
        return updated.slice(0, 5);
      });
    }
  };

  // Gérer le changement des photos intérieures
  const handleInteriorPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setInteriorPhotos(prev => {
        const updated = [...prev, ...newPhotos];
        // Limiter à 5 photos
        return updated.slice(0, 5);
      });
    }
  };

  // Supprimer une photo extérieure
  const removeExteriorPhoto = (index: number) => {
    setExteriorPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Supprimer une photo intérieure
  const removeInteriorPhoto = (index: number) => {
    setInteriorPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Obtenir la position géographique actuelle
  const getGeolocation = () => {
    if (navigator.geolocation) {
      setError("");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError(`Erreur de géolocalisation: ${error.message}`);
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  // Vérifier le code
  const verifyCode = () => {
    // Pour le test, nous vérifions simplement si le code est "123456"
    if (verificationCode === "123456") {
      setIsCodeValid(true);
      setError("");
    } else {
      setIsCodeValid(false);
      setError("Code invalide. Pour le test, utilisez '123456'.");
    }
  };

  // Effacer la signature
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureImage("");
    }
  };
  
  // Générer et télécharger le contrat PDF
  const generateContract = async () => {
    if (!signatureImage) {
      setError("Impossible de générer le contrat sans signature");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      // Préparer les données pour l'API
      const contractData = {
        clientName: "Client Test", // Dans une vraie application, utilisez le nom réel du client
        pickupDate: new Date().toISOString(),
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        signatureData: signatureImage,
        photos: [
          ...exteriorPhotos.map((p, i) => `Photo extérieure ${i + 1}`),
          ...interiorPhotos.map((p, i) => `Photo intérieure ${i + 1}`)
        ]
      };

      // Appeler l'API pour générer le PDF
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du contrat");
      }

      // Obtenir le blob depuis la réponse
      const pdfBlob = await response.blob();
      
      // Créer un URL pour le blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Créer un élément a pour déclencher le téléchargement
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `contrat_pickup_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Libérer l'URL de l'objet
      URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setError("Une erreur est survenue lors de la génération du contrat");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Fonction pour traiter et afficher les données collectées
  const handleSubmit = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      
      // Afficher les données collectées dans la console
      console.log({
        extPhotos: exteriorPhotos.map(photo => ({
          name: photo.file.name,
          type: photo.file.type,
          size: photo.file.size,
          preview: photo.preview
        })),
        intPhotos: interiorPhotos.map(photo => ({
          name: photo.file.name,
          type: photo.file.type,
          size: photo.file.size,
          preview: photo.preview
        })),
        geo: location,
        code: verificationCode,
        signatureData
      });
      
      return signatureData;
    }
    return null;
  };

  // Soumettre le formulaire de pickup
  const submitPickup = async () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setIsSubmitting(true);
      setError("");

      try {
        // Récupérer l'image de la signature et afficher les données
        const signatureData = handleSubmit();
        if (signatureData) {
          setSignatureImage(signatureData);
        }

        // Simuler un appel API pour le pickup
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Préparer les données pour l'API de génération du contrat
        const contractData = {
          clientName: "Client Test", // Dans une vraie application, utilisez le nom réel du client
          pickupDate: new Date().toISOString(),
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          signatureData: signatureData || "",
          photos: [
            ...exteriorPhotos.map((p, i) => `Photo extérieure ${i + 1}`),
            ...interiorPhotos.map((p, i) => `Photo intérieure ${i + 1}`)
          ]
        };
        
        // Appeler l'API pour générer le PDF
        const response = await fetch("/api/generate-contract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contractData),
        });
        
        if (!response.ok) {
          console.error("Erreur lors de la génération du contrat:", await response.text());
        } else {
          // Obtenir le blob depuis la réponse
          const pdfBlob = await response.blob();
          
          // Créer un URL pour le blob
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Créer un élément a pour déclencher le téléchargement
          const downloadLink = document.createElement("a");
          downloadLink.href = pdfUrl;
          downloadLink.download = `contrat_pickup_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Libérer l'URL de l'objet
          URL.revokeObjectURL(pdfUrl);
        }

        // Simuler que l'envoi a réussi
        setIsCompleted(true);
      } catch (err) {
        console.error("Erreur lors de la soumission:", err);
        setError("Une erreur est survenue lors de l'envoi du formulaire");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError("Veuillez signer avant de terminer le pickup");
    }
  };

  // Passer à l'étape suivante
  const goToNextStep = () => {
    if (step === 1) {
      if (exteriorPhotos.length === 0) {
        setError("Veuillez télécharger au moins une photo extérieure");
        return;
      }
    } else if (step === 2) {
      if (interiorPhotos.length === 0) {
        setError("Veuillez télécharger au moins une photo intérieure");
        return;
      }
    } else if (step === 3) {
      if (!location) {
        setError("Veuillez obtenir votre position géographique");
        return;
      }
    }

    setError("");
    setStep(prev => prev + 1);
  };

  // Revenir à l'étape précédente
  const goToPreviousStep = () => {
    setError("");
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Si le pickup est terminé, afficher le message de confirmation
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pickup terminé avec succès!</h2>
          <p className="text-gray-600 mb-6">
            Toutes les informations ont été enregistrées. Merci d'avoir complété le processus de pickup.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={generateContract}
              disabled={isGeneratingPdf}
              className={`w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGeneratingPdf ? 'Génération en cours...' : 'Télécharger le contrat PDF'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
            >
              Nouveau pickup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Formulaire de pickup</h2>
          <p className="mt-2 text-lg text-gray-600">
            Complétez toutes les étapes pour finaliser le pickup du véhicule
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center w-full">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex-1 h-2 ${
                  stepNumber <= step ? "bg-blue-500" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {[
              "Photos extérieures",
              "Photos intérieures",
              "Géolocalisation",
              "Vérification"
            ].map((label, index) => (
              <div
                key={index}
                className={`text-xs font-medium ${
                  index + 1 <= step ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Étape {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Étape 1: Photos extérieures */}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Photos extérieures du véhicule
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Veuillez télécharger 5 photos montrant l'extérieur du véhicule (avant, arrière, côtés, etc.)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {exteriorPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                        <img
                          src={photo.preview}
                          alt={`Photo extérieure ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeExteriorPhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {exteriorPhotos.length < 5 && (
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
                      <label className="cursor-pointer text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-sm font-medium text-gray-700">
                          Ajouter une photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleExteriorPhotoChange}
                          multiple
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  {exteriorPhotos.length} sur 5 photos téléchargées
                </div>
              </div>
            )}

            {/* Étape 2: Photos intérieures */}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Photos intérieures du véhicule
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Veuillez télécharger 5 photos montrant l'intérieur du véhicule (tableau de bord, sièges, coffre, etc.)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {interiorPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                        <img
                          src={photo.preview}
                          alt={`Photo intérieure ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeInteriorPhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {interiorPhotos.length < 5 && (
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
                      <label className="cursor-pointer text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-sm font-medium text-gray-700">
                          Ajouter une photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleInteriorPhotoChange}
                          multiple
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  {interiorPhotos.length} sur 5 photos téléchargées
                </div>
              </div>
            )}

            {/* Étape 3: Géolocalisation */}
            {step === 3 && (
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Localisation du véhicule
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Veuillez indiquer la position actuelle du véhicule en utilisant votre géolocalisation.
                </p>

                <div className="flex flex-col items-center justify-center mb-6">
                  <button
                    onClick={getGeolocation}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Obtenir ma position
                  </button>

                  {location && (
                    <div className="bg-gray-100 p-4 rounded-md w-full">
                      <h4 className="font-medium text-gray-700 mb-2">Position actuelle:</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Latitude:</span>
                          <p className="font-mono">{location.latitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Longitude:</span>
                          <p className="font-mono">{location.longitude.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Étape 4: Vérification et signature */}
            {step === 4 && (
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Vérification finale et signature
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code de vérification
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Entrez le code reçu par email"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isCodeValid}
                    />
                    <button
                      onClick={verifyCode}
                      className={`px-4 py-2 text-white rounded-r-md transition ${
                        isCodeValid
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                      disabled={isCodeValid}
                    >
                      {isCodeValid ? "Vérifié" : "Vérifier"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Pour le test, utilisez le code "123456"
                  </p>
                </div>

                {isCodeValid && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden mb-2">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-48 touch-none"
                      ></canvas>
                    </div>
                    <button
                      onClick={clearSignature}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Effacer la signature
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={submitPickup}
                disabled={!isCodeValid || isSubmitting}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !isCodeValid || isSubmitting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Envoi en cours..." : "Terminer le pickup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
