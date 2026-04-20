import { Router } from 'express';
import { register, login } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register - Register a new doctor
router.post('/register', register);

// POST /api/auth/login - Doctor login
router.post('/login', login);

export default router;
