import { CollectionGroup } from "firebase-admin/firestore";
import { Student, StudentPrimitives } from "../../domain/Student";
import { StudentRepository } from "../../domain/StudentRepository";

interface StudentDocument extends Omit<StudentPrimitives, "id"> {
  _id: string;
}

