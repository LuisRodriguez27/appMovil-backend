import configureFirebase, { firestore, firebaseAuth } from '../../app/config/configureFirebase';

// Script para crear un usuario estudiante en Firestore
async function createStudentUser() {
  try {
    // Inicializar Firebase
    configureFirebase();

    const studentUserData = {
      __id: 'student_test_001',
      control_number: 'STUDENT001',
      name: 'Student Test',
      email: 'student@test.com',
      role: 'student',  // ← Rol de estudiante
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
      .doc(studentUserData.__id)
      .set(studentUserData);


    // Ahora crear el usuario en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().createUser({
        uid: studentUserData.__id,
        email: studentUserData.email,
        password: 'Student123!', // Contraseña temporal
        displayName: studentUserData.name,
      });

    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
      } else {
        console.error('❌ Error creando usuario en Firebase Auth:', authError.message);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario estudiante:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createStudentUser();
