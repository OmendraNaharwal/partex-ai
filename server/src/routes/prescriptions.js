import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionById,
} from '../controllers/prescriptionController.js';

const router = Router();

// POST /api/prescriptions - Generate prescription from consultation
router.post('/', createPrescription);

// GET /api/prescriptions/patient/:patientId - Get patient's prescriptions
router.get('/patient/:patientId', getPrescriptionsByPatient);

// GET /api/prescriptions/:id - Get a specific prescription
router.get('/:id', getPrescriptionById);

export default router;
