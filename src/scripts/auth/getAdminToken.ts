import configureFirebase, { firebaseAuth } from '../../app/config/configureFirebase';

// Script para obtener un custom token para el usuario admin
async function getAdminToken() {
  try {
    // Inicializar Firebase
    configureFirebase();

    const uid = 'admin_test_001';

    // Crear un custom token
    const customToken = await firebaseAuth().createCustomToken(uid);


    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando token:', error);
    process.exit(1);
  }
}

// Ejecutar el script
getAdminToken();
