import configureFirebase, { firestore, firebaseAuth } from '../../app/config/configureFirebase';

// Script para crear un usuario administrador en Firestore
async function createAdminUser() {
  try {
    // Inicializar Firebase
    configureFirebase();

    const adminUserData = {
      __id: 'admin_test_001',
      control_number: 'ADMIN001',
      name: 'Admin Test',
      email: 'admin@test.com',
      role: 'admin',
      xp: 0,
      level: 1,
      current_course: null,
      profile_picture: null,
      progress: {},
      achievements: [],
      streak_data: {
        current_streak: 0,
        best_streak: 0,
        last_study_date: ''
      },
      stats: {
        total_lessons_completed: 0,
        total_exercises_completed: 0,
        total_courses_completed: 0
      }
    };

    // Crear usuario en Firestore
    await firestore()
      .collection('users')
      .doc(adminUserData.__id)
      .set(adminUserData);

    console.log('✅ Usuario administrador creado exitosamente en Firestore');
    console.log('📧 Email:', adminUserData.email);
    console.log('🆔 ID:', adminUserData.__id);
    console.log('👤 Rol:', adminUserData.role);

    // Ahora crear el usuario en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().createUser({
        uid: adminUserData.__id,
        email: adminUserData.email,
        password: 'Admin123!', // Contraseña temporal
        displayName: adminUserData.name,
      });

      console.log('✅ Usuario creado en Firebase Authentication');
      console.log('🔑 UID:', userRecord.uid);
      console.log('🔐 Password temporal: Admin123!');
      console.log('\n🎯 Para obtener el token, usa este endpoint:');
      console.log('POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY');
      console.log('Body: { "email": "admin@test.com", "password": "Admin123!", "returnSecureToken": true }');
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('⚠️  Usuario ya existe en Firebase Auth, solo se actualizó Firestore');
      } else {
        console.error('❌ Error creando usuario en Firebase Auth:', authError.message);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createAdminUser();
