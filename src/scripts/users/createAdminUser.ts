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


    // Ahora crear el usuario en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().createUser({
        uid: adminUserData.__id,
        email: adminUserData.email,
        password: 'Admin123!', // Contraseña temporal
        displayName: adminUserData.name,
      });

    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
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
