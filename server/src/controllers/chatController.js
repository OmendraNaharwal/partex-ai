import { queryPatientHistory, getPatientSummary } from '../services/ragService.js';

// POST /api/chat - Ask a question about a patient's history (RAG)
export const askQuestion = async (req, res, next) => {
  try {
    const { patientId, query } = req.body;

    if (!patientId || !query) {
      return res.status(400).json({ error: 'Patient ID and query are required' });
    }

    const result = await queryPatientHistory(patientId, query);

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/summary/:patientId - Get a patient's visit summary
export const getSummary = async (req, res, next) => {
  try {
    const summary = await getPatientSummary(req.params.patientId);
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
