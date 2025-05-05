import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Utiliser la même clé secrète que pour la signature
const JWT_SECRET = 'votre_cle_secrete_jwt';

export async function POST(request: Request) {
  try {
    // Récupérer le token depuis le corps de la requête
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token manquant', valid: false },
        { status: 400 }
      );
    }

    // Vérifier la validité du token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Renvoyer les informations du token décodé
      return NextResponse.json({
        message: 'Token valide',
        valid: true,
        user: decoded
      }, { status: 200 });
      
    } catch (error) {
      // Le token est invalide ou a expiré
      return NextResponse.json(
        { message: 'Token invalide ou expiré', valid: false },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la vérification du token', valid: false },
      { status: 500 }
    );
  }
} 