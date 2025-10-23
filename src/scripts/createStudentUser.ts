import configureFirebase, { firestore, firebaseAuth } from '../app/config/configureFirebase';

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

    console.log('✅ Usuario estudiante creado exitosamente en Firestore');
    console.log('📧 Email:', studentUserData.email);
    console.log('🆔 ID:', studentUserData.__id);
    console.log('👤 Rol:', studentUserData.role);

    // Ahora crear el usuario en Firebase Authentication
    try {
      const userRecord = await firebaseAuth().createUser({
        uid: studentUserData.__id,
        email: studentUserData.email,
        password: 'Student123!', // Contraseña temporal
        displayName: studentUserData.name,
      });

      console.log('✅ Usuario creado en Firebase Authentication');
      console.log('🔑 UID:', userRecord.uid);
      console.log('🔐 Password temporal: Student123!');
      console.log('\n🎯 Para obtener el token, usa este endpoint:');
      console.log('POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY');
      console.log('Body: { "email": "student@test.com", "password": "Student123!", "returnSecureToken": true }');
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('⚠️  Usuario ya existe en Firebase Auth, solo se actualizó Firestore');
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
