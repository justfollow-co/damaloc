import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    const { clientName, pickupDate, latitude, longitude, signatureData, photos } = await request.json();

    // Valider les données requises
    if (!clientName || !pickupDate || !latitude || !longitude || !signatureData) {
      return NextResponse.json(
        { message: 'Les informations requises sont manquantes' },
        { status: 400 }
      );
    }

    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    
    // Ajouter une page au document
    const page = pdfDoc.addPage([595.28, 841.89]); // Format A4
    
    // Obtenir la police standard
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Définir les dimensions et positions
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;
    const lineHeight = 20;
    
    // Titre du document
    page.drawText('CONTRAT DE PICKUP VÉHICULE', {
      x: margin,
      y: currentY,
      size: 20,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight * 2;
    
    // Ajouter les informations du client
    page.drawText('Informations du client:', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    page.drawText(`Nom du client: ${clientName}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    // Formatage de la date
    const formattedDate = new Date(pickupDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    page.drawText(`Date du pickup: ${formattedDate}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight * 2;
    
    // Ajouter les informations de géolocalisation
    page.drawText('Localisation:', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    page.drawText(`Latitude: ${latitude}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    page.drawText(`Longitude: ${longitude}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight * 2;
    
    // Photos référencées
    page.drawText('Photos prises lors du pickup:', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    if (photos && photos.length > 0) {
      for (let i = 0; i < Math.min(photos.length, 5); i++) {
        page.drawText(`- Photo ${i + 1}: ${photos[i]}`, {
          x: margin,
          y: currentY,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= lineHeight;
      }
      
      if (photos.length > 5) {
        page.drawText(`+ ${photos.length - 5} autres photos`, {
          x: margin,
          y: currentY,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= lineHeight;
      }
    } else {
      page.drawText('Aucune photo référencée', {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      currentY -= lineHeight;
    }
    
    currentY -= lineHeight * 2;
    
    // Section de signature
    page.drawText('Signature du client:', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight;
    
    // Décoder l'image de signature base64
    try {
      // Vérifier et nettoyer le format base64 si nécessaire
      const signatureBase64 = signatureData.startsWith('data:image') 
        ? signatureData.split(',')[1]
        : signatureData;
        
      // Intégrer l'image de signature dans le PDF
      const signatureImage = await pdfDoc.embedPng(
        Buffer.from(signatureBase64, 'base64')
      );
      
      // Calculer les dimensions pour maintenir le ratio
      const signatureDims = signatureImage.scale(0.5); // Ajuster l'échelle selon besoins
      
      // Dessiner l'image de signature
      page.drawImage(signatureImage, {
        x: margin,
        y: currentY - signatureDims.height,
        width: signatureDims.width,
        height: signatureDims.height,
      });
      
      currentY -= (signatureDims.height + lineHeight);
    } catch (error) {
      console.error('Erreur lors de l\'intégration de la signature:', error);
      page.drawText('Erreur: Impossible d\'afficher la signature', {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaFont,
        color: rgb(1, 0, 0), // Rouge
      });
      currentY -= lineHeight;
    }
    
    currentY -= lineHeight * 2;
    
    // Pied de page
    const currentDate = new Date().toLocaleDateString('fr-FR');
    page.drawText(`Document généré le ${currentDate}. Ce document fait office de contrat de pickup.`, {
      x: margin,
      y: margin,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Sérialiser le document PDF en bytes
    const pdfBytes = await pdfDoc.save();
    
    // Générer un nom de fichier
    const fileName = `contrat_pickup_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Créer une nouvelle réponse avec le PDF
    const response = new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la génération du contrat' },
      { status: 500 }
    );
  }
}
