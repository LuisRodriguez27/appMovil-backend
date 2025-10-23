import configureFirebase, { firebaseAuth, firestore } from '../app/config/configureFirebase';

/**
 * Script para verificar que un usuario existe en Firebase Auth y Firestore
 * y mostrar sus datos
 */

async function verifyUser(email: string) {
  try {
    configureFirebase();

    console.log('\n🔍 Verificando usuario:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().getUserByEmail(email);
      console.log('✅ Usuario encontrado en Firebase Authentication');
      console.log('   🆔 UID:', userRecord.uid);
      console.log('   📧 Email:', userRecord.email);
      console.log('   👤 Display Name:', userRecord.displayName || '(no configurado)');
      console.log('   🔐 Email Verified:', userRecord.emailVerified);
      console.log('   📅 Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
      console.log('   📅 Last Sign In:', userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString() : 'Nunca');
    } catch (error: any) {
      console.log('❌ Usuario NO encontrado en Firebase Authentication');
      console.log('   Error:', error.message);
      console.log('\n💡 Solución: Ejecuta el script de creación:');
      console.log('   npx ts-node src/scripts/createStudentUser.ts');
      console.log('   o');
      console.log('   npx ts-node src/scripts/createAdminUser.ts');
      return;
    }

    console.log('');

    // Verificar en Firestore
    const usersSnapshot = await firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ Usuario NO encontrado en Firestore');
      console.log('\n💡 Solución: Ejecuta el script de creación para crear el documento en Firestore');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log('✅ Usuario encontrado en Firestore');
    console.log('   🆔 Document ID:', userDoc.id);
    console.log('   📧 Email:', userData.email);
    console.log('   👤 Name:', userData.name);
    console.log('   🎭 Role:', userData.role);
    console.log('   📊 Control Number:', userData.control_number);
    console.log('   ⭐ XP:', userData.xp);
    console.log('   📈 Level:', userData.level);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Usuario válido y completo en ambos sistemas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Para obtener el token JWT:');
    console.log('1. Obtén tu Firebase Web API Key de Firebase Console');
    console.log('2. Configúrala en .env o en getAuthToken.ts');
    console.log('3. Ejecuta: npx ts-node src/scripts/getAuthToken.ts');
    console.log('\nO usa Postman directamente:');
    console.log('POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY');
    console.log('Body:');
    console.log(JSON.stringify({
      email: email,
      password: userData.role === 'admin' ? 'Admin123!' : 'Student123!',
      returnSecureToken: true
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verificando usuario:', error);
    process.exit(1);
  }
}

// Verificar ambos usuarios
const emailToVerify = process.argv[2] || 'student@test.com';

console.log('\n🔍 Script de Verificación de Usuarios');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Uso: npx ts-node src/scripts/verifyUser.ts [email]');
console.log('Ejemplos:');
console.log('  npx ts-node src/scripts/verifyUser.ts student@test.com');
console.log('  npx ts-node src/scripts/verifyUser.ts admin@test.com');

verifyUser(emailToVerify);
