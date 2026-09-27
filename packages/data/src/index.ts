export { dataConfigFromEnv, DataConfigurationError, type DataConfig } from './config.ts';
export { DataError, type DataErrorCode } from './errors.ts';
export { INDEXES, TABLES, physicalTableName, type IndexSpec, type TableKey, type TableSpec } from './schema.ts';
export {
  countStudents,
  ensureStudent,
  getStudent,
  getStudents,
  listStudents,
  updateStudentProfile,
  type AuthProvider,
  type StudentIdentity,
  type StudentProfile,
} from './students.ts';
export {
  getCareerProgressMany,
  getProgress,
  listProgressByCareer,
  listProgressForStudent,
  listRunEvents,
  recordFromState,
  type CareerProgressRecord,
  type CareerProgressSummary,
  type DecisionEvent,
} from './progress.ts';
export {
  beginSession,
  ensureCareerProgress,
  moduleFor,
  restartCareer,
  submitSceneResponse,
} from './simulation-service.ts';
export { careerOverview, type CareerOverview } from './overview.ts';
