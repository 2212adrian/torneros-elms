
import { Student, Grade, Gender, Semester } from './types';

const sections = ['BSIT-3B', 'BSIT-3A', 'BSCS-2A'];
const subjects = [
  'Introduction to Computing', 'Programming 1', 'Discrete Mathematics',
  'Data Structures', 'Database Systems', 'Software Engineering',
  'Web Development', 'Mobile App Dev', 'Artificial Intelligence'
];
const schoolYears = ['2023-2024', '2024-2025', '2025-2026'];
const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const mockStudents: Student[] = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1;
  const gender = id % 2 === 0 ? Gender.FEMALE : Gender.MALE;
  const section = sections[id % sections.length];
  const age = 19 + (id % 5);
  const birthYear = 2025 - age;
  const idCode = (100000 + i).toString();
  
  return {
    uuid: crypto.randomUUID(),
    idCode: idCode,
    fullName: [
      'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
      'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
      'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
      'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
      'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'
    ][i] + ' ' + [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
    ][i % 20],
    contactNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
    email: `student${idCode}@torneros.edu.ph`,
    gender: gender,
    birthdate: `${birthYear}-0${(id % 9) + 1}-1${id % 10}`,
    age: age,
    yearLevel: '3rd Year',
    section: section,
    semester: Semester.FIRST,
    schoolYear: '2025-2026'
  };
});

export const mockGrades: Grade[] = mockStudents.flatMap(student => {
  const grades: Grade[] = [];
  
  // Generate grades for 1st Year to current Year
  ['1st Year', '2nd Year', '3rd Year'].forEach((year, yrIdx) => {
    [Semester.FIRST, Semester.SECOND].forEach(sem => {
      // 2 subjects per semester for mock
      for(let s = 0; s < 2; s++) {
        const p = 75 + Math.floor(Math.random() * 25);
        const m = 75 + Math.floor(Math.random() * 25);
        const pf = 75 + Math.floor(Math.random() * 25);
        const f = 75 + Math.floor(Math.random() * 25);
        const avg = (p + m + pf + f) / 4;
        
        grades.push({
          id: crypto.randomUUID(),
          studentIdCode: student.idCode,
          subjectName: subjects[(yrIdx * 4 + (sem === Semester.FIRST ? 0 : 2) + s) % subjects.length],
          prelim: p,
          midterm: m,
          prefinal: pf,
          finals: f,
          average: parseFloat(avg.toFixed(2)),
          semester: sem,
          yearLevel: year,
          schoolYear: schoolYears[yrIdx]
        });
      }
    });
  });
  
  return grades;
});
