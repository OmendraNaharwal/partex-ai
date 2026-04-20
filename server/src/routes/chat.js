import { Router } from 'express';
import { askQuestion, getSummary } from '../controllers/chatController.js';

const router = Router();

// POST /api/chat - Ask a question about a patient's history (RAG)
router.post('/', askQuestion);

// GET /api/chat/summary/:patientId - Get a patient's visit summary
router.get('/summary/:patientId', getSummary);

export default router;
