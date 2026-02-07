
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum Semester {
  FIRST = '1st Semester',
  SECOND = '2nd Semester'
}

export interface Student {
  uuid: string;
  idCode: string; // 6-digit identifier
  fullName: string;
  contactNumber: string;
  email: string;
  gender: Gender;
  birthdate: string;
  age: number;
  yearLevel: string;
  section: string;
  semester: Semester;
  schoolYear: string;
}

export interface Grade {
  id: string;
  studentIdCode: string; // Using 6-digit ID as foreign key
  subjectName: string;
  prelim: number;
  midterm: number;
  prefinal: number;
  finals: number;
  average: number;
  semester: Semester;
  yearLevel: string; // Added to categorize 1st-4th year
  schoolYear: string;
}

export interface AccessToken {
  id: string;
  token: string;
  studentIdCode: string; // Linked directly to student
  description: string;
  createdAt: string;
}

export type ViewState = 'dashboard' | 'masterlist' | 'grading' | 'tokens' | 'analytics';

export interface User {
  role: 'teacher' | 'guest';
  token?: string;
  studentData?: Student;
}
