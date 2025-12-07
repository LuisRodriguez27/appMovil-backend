import configureFirebase, { firebaseAuth, firestore } from '../../app/config/configureFirebase';

/**
 * Script para verificar que un usuario existe en Firebase Auth y Firestore
 * y mostrar sus datos
 */

async function verifyUser(email: string) {
  try {
    configureFirebase();


    // Verificar en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().getUserByEmail(email);
    } catch (error: any) {
      return;
    }


    // Verificar en Firestore
    const usersSnapshot = await firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log(JSON.stringify({
      email: email,
      role: userData.role,
      uid: userDoc.id,
      auth: 'Exists',
      firestore: 'Exists'
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verificando usuario:', error);
    process.exit(1);
  }
}

// Verificar ambos usuarios
const emailToVerify = process.argv[2] || 'student@test.com';


verifyUser(emailToVerify);
