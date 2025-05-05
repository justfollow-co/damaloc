import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Clé secrète pour signer le token JWT - en production, utilisez une variable d'environnement
const JWT_SECRET = 'votre_cle_secrete_jwt';
// Mode développement - en production, définissez cette valeur sur false
const IS_DEV_MODE = true;

export async function POST(request: Request) {
  try {
    // Récupérer l'email depuis le corps de la requête
    const { email } = await request.json();

    // Vérifier si l'email est fourni
    if (!email) {
      return NextResponse.json(
        { message: "L'adresse email est requise" },
        { status: 400 }
      );
    }
    
    // Générer un token JWT qui expire dans 10 minutes
    const token = jwt.sign(
      { email },
      JWT_SECRET,
      { expiresIn: '10m' } // 10 minutes
    );
    
    // Construire le lien de connexion avec le token
    const loginLink = `${request.headers.get('origin') || 'http://localhost:3000'}/auth/verify?token=${token}`;
    
    // Pour une utilisation directe avec le dashboard
    const dashboardLink = `${request.headers.get('origin') || 'http://localhost:3000'}/dashboard?token=${token}`;
    
    // Afficher le lien de connexion dans la console
    console.log('Lien de connexion généré:');
    console.log(loginLink);
    console.log('Lien vers le tableau de bord:');
    console.log(dashboardLink);
    console.log(`Pour l'utilisateur: ${email}`);
    console.log(`Le token expirera dans 10 minutes.`);

    // Renvoyer une réponse réussie
    // En mode développement, inclure le token pour faciliter le test
    return NextResponse.json(
      {
        message: 'Lien de connexion généré avec succès',
        ...(IS_DEV_MODE ? { token, dashboardLink } : {})
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la génération du lien de connexion:', error);
    
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la génération du lien de connexion' },
      { status: 500 }
    );
  }
} 