import configureFirebase, { firebaseAuth } from '../app/config/configureFirebase';

// Script para obtener un custom token para el usuario admin
async function getAdminToken() {
  try {
    // Inicializar Firebase
    configureFirebase();

    const uid = 'admin_test_001';

    // Crear un custom token
    const customToken = await firebaseAuth().createCustomToken(uid);

    console.log('\n✅ Custom Token generado exitosamente\n');
    console.log('🔑 Token:');
    console.log(customToken);
    console.log('\n📝 Para usar este token:');
    console.log('1. Intercambia el custom token por un ID token usando:');
    console.log('   POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=YOUR_API_KEY');
    console.log('   Body: { "token": "' + customToken + '", "returnSecureToken": true }');
    console.log('\n2. O úsalo directamente en tus requests con:');
    console.log('   Authorization: Bearer ' + customToken);
    console.log('\n🧪 Para probar el endpoint de creación de cursos:');
    console.log('curl -X POST http://localhost:3000/api/courses \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Authorization: Bearer ' + customToken + '" \\');
    console.log('  -d \'{"title": "Curso de Prueba", "description": "Este es un curso de prueba creado por el administrador"}\'');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando token:', error);
    process.exit(1);
  }
}

// Ejecutar el script
getAdminToken();
