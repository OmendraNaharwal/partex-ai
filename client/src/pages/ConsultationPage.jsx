import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function ConsultationPage() {
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');

  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [interimText, setInterimText] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [manualTranscript, setManualTranscript] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    const onReady = (payload) => {
      setSessionId(payload.sessionId);
      setError('');
    };

    const onInterim = (payload) => {
      setInterimText(payload.text || '');
    };

    const onFinal = (payload) => {
      setInterimText('');
      setFinalTranscript(payload.fullTranscript || '');
    };

    const onProgress = (payload) => setProgress(payload);

    const onComplete = (payload) => {
      setResult(payload);
      setIsRecording(false);
      setProgress(null);
      if (!payload.success) {
        setError(payload.message || 'Extraction failed');
      }
    };

    const onSocketError = (payload) => {
      setError(payload.message || 'Socket error');
      setIsRecording(false);
    };

    socket.on('audio:ready', onReady);
    socket.on('transcript:interim', onInterim);
    socket.on('transcript:final', onFinal);
    socket.on('extraction:progress', onProgress);
    socket.on('extraction:complete', onComplete);
    socket.on('error', onSocketError);

    return () => {
      socket.off('audio:ready', onReady);
      socket.off('transcript:interim', onInterim);
      socket.off('transcript:final', onFinal);
      socket.off('extraction:progress', onProgress);
      socket.off('extraction:complete', onComplete);
      socket.off('error', onSocketError);
    };
  }, [socket]);

  const startRecording = async () => {
    if (!patientId.trim()) {
      setError('Patient ID is required');
      return;
    }

    setError('');
    setResult(null);
    setFinalTranscript('');
    setInterimText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && socket.connected) {
          const arrayBuffer = await event.data.arrayBuffer();
          socket.emit('audio:chunk', arrayBuffer);
        }
      };

      socket.emit('audio:start', { patientId });
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (startError) {
      setError(startError.message || 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;

    socket.emit('audio:stop');
    setIsRecording(false);
  };

  const submitManualTranscript = async () => {
    if (!patientId.trim() || !manualTranscript.trim()) {
      setError('Patient ID and transcript are required');
      return;
    }

    setManualBusy(true);
    setError('');

    try {
      const { data } = await api.post('/consultations?assist=true', {
        patientId,
        transcript: manualTranscript,
      });
      setResult({
        success: true,
        sessionId: data.consultation.sessionId,
        structuredData: data.consultation.structuredData,
        aiSuggestions: data.consultation.aiSuggestions,
        transcript: data.consultation.transcript,
      });
      setSessionId(data.consultation.sessionId);
    } catch (manualError) {
      setError(manualError?.response?.data?.error || manualError.message || 'Failed to process transcript');
    } finally {
      setManualBusy(false);
    }
  };

  const uploadVoiceFile = async () => {
    if (!patientId.trim()) {
      setError('Patient ID is required');
      return;
    }

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setUploadBusy(true);
    setError('');
    setResult(null);
    setProgress({ stage: 'Uploading and processing audio...', percent: 10 });

    try {
      const formData = new FormData();
      formData.append('patientId', patientId.trim());
      formData.append('audio', audioFile);

      const { data } = await api.post('/consultations', formData, {
        timeout: 180000,
      });

      setResult({
        success: true,
        sessionId: data.consultation.sessionId,
        structuredData: data.consultation.structuredData,
        aiSuggestions: data.consultation.aiSuggestions,
        transcript: data.consultation.transcript,
      });
      setSessionId(data.consultation.sessionId);
      setFinalTranscript(data.consultation.transcript || '');
      setProgress(null);
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (uploadError) {
      setProgress(null);
      const serverError = uploadError?.response?.data?.error;
      const statusCode = uploadError?.response?.status;
      setError(
        serverError
          ? `Upload failed (${statusCode}): ${serverError}`
          : (uploadError.message || 'Failed to process audio upload')
      );
    } finally {
      setUploadBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h1 className="text-2xl font-bold">Live Consultation</h1>
        <p className="text-sm text-slate-300">Start recording to stream audio chunks to backend and receive live transcription.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Patient ID (e.g. PAT-123456)"
            className="min-w-[280px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
          {!isRecording ? (
            <button type="button" onClick={startRecording} className="rounded-lg bg-rose-300 px-4 py-2 font-semibold text-slate-900">
              Start Recording
            </button>
          ) : (
            <button type="button" onClick={stopRecording} className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-900">
              Stop Recording
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Interim Transcript</p>
            <p className="text-sm text-slate-200">{interimText || 'Waiting for speech...'}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Final Transcript</p>
            <p className="text-sm text-slate-200">{finalTranscript || 'Final transcript will accumulate here.'}</p>
          </div>
        </div>

        {progress && (
          <div className="mt-4 rounded-xl border border-cyan-500/50 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            {progress.stage} ({progress.percent}%)
          </div>
        )}

        {error && <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        <div className="mt-4 text-xs text-slate-400">Session: {sessionId || 'not started'}</div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Manual Transcript Processing</h2>
        <p className="text-sm text-slate-300">Paste transcript and process through consultation API if microphone streaming is unavailable.</p>
        <textarea
          className="mt-3 h-36 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={manualTranscript}
          onChange={(e) => setManualTranscript(e.target.value)}
          placeholder="Paste doctor-patient transcript..."
        />
        <button type="button" onClick={submitManualTranscript} disabled={manualBusy} className="mt-3 rounded-lg bg-emerald-300 px-4 py-2 font-semibold text-slate-900 disabled:opacity-60">
          {manualBusy ? 'Processing...' : 'Process Transcript'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Upload Voice File</h2>
        <p className="text-sm text-slate-300">Upload an audio file to process through the same consultation route (supports WAV, WebM, OGG, MP3, M4A, MP4).</p>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.webm,.ogg,.mp3,.m4a,.mp4"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100"
          />
          <button
            type="button"
            onClick={uploadVoiceFile}
            disabled={uploadBusy}
            className="rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-slate-900 disabled:opacity-60"
          >
            {uploadBusy ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>

        {audioFile && (
          <p className="mt-3 text-xs text-slate-400">
            Selected: {audioFile.name} ({Math.ceil(audioFile.size / 1024)} KB)
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Extraction Result</h2>
        {result ? (
          <div className="mt-3 space-y-3 text-sm">
            <p><span className="text-slate-400">Success:</span> {String(result.success)}</p>
            <p><span className="text-slate-400">Session ID:</span> {result.sessionId}</p>
            <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">
{JSON.stringify(result.structuredData || {}, null, 2)}
            </pre>
            <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">
{JSON.stringify(result.aiSuggestions || {}, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No result yet.</p>
        )}
      </section>
    </div>
  );
}
