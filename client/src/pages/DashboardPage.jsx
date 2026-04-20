import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const emptyPatient = {
  name: '',
  age: '',
  gender: 'male',
  phone: '',
  bloodGroup: '',
  allergies: '',
};

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyPatient);
  const [creating, setCreating] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [chatQuestion, setChatQuestion] = useState('What were the latest vitals?');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatSources, setChatSources] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);

  const fetchPatients = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/patients', { params: { q: search, limit: 50 } });
      setPatients(data.patients || []);
    } catch (fetchError) {
      setError(fetchError?.response?.data?.error || fetchError.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const stats = useMemo(() => {
    const total = patients.length;
    const withAllergy = patients.filter((patient) => (patient.allergies || []).length > 0).length;
    const genders = patients.reduce(
      (acc, patient) => {
        const key = patient.gender || 'other';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { male: 0, female: 0, other: 0 }
    );

    return { total, withAllergy, genders };
  }, [patients]);

  const onCreatePatient = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.post('/patients', {
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies ? form.allergies.split(',').map((item) => item.trim()).filter(Boolean) : [],
      });
      setForm(emptyPatient);
      setFormOpen(false);
      await fetchPatients(query);
    } catch (createError) {
      setError(createError?.response?.data?.error || createError.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  const askQuestion = async () => {
    if (!selectedPatientId || !chatQuestion.trim()) return;

    setChatBusy(true);
    setError('');

    try {
      const { data } = await api.post('/chat', {
        patientId: selectedPatientId,
        query: chatQuestion,
      });
      setChatAnswer(data.answer || 'No answer');
      setChatSources(data.sources || []);
    } catch (chatError) {
      setError(chatError?.response?.data?.error || chatError.message || 'Chat failed');
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Patients</p>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Allergy Cases</p>
          <p className="mt-2 text-3xl font-bold">{stats.withAllergy}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Male/Female</p>
          <p className="mt-2 text-3xl font-bold">{stats.genders.male}/{stats.genders.female}</p>
        </div>
        <div className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Actions</p>
          <button
            className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
            onClick={() => setFormOpen((prev) => !prev)}
          >
            {formOpen ? 'Hide Form' : 'Add Patient'}
          </button>
        </div>
      </section>

      {error && <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      {formOpen && (
        <form onSubmit={onCreatePatient} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 md:grid-cols-3">
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Name" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))} />
          <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Blood Group" value={form.bloodGroup} onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value }))} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Allergies (comma separated)" value={form.allergies} onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))} />
          <button type="submit" disabled={creating} className="rounded-lg bg-cyan-300 px-3 py-2 font-semibold text-slate-900 disabled:opacity-60">
            {creating ? 'Creating...' : 'Create Patient'}
          </button>
        </form>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, patientId"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <button className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-900" onClick={() => fetchPatients(query)}>
              Search
            </button>
          </div>

          {loading ? (
            <p className="text-slate-300">Loading patients...</p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.patientId} className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-slate-300">{patient.patientId} • {patient.gender || 'n/a'} • {patient.age || '-'} yrs</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-900" to={`/consultation?patientId=${patient.patientId}`}>
                        Start Consultation
                      </Link>
                      <button className="rounded-lg border border-slate-600 px-3 py-2 text-sm" onClick={() => setSelectedPatientId(patient.patientId)}>
                        Use In Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!patients.length && <p className="text-slate-300">No patients found.</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">Patient Q&A</p>
          <input
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Patient ID"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          />
          <textarea
            className="mb-3 h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
          />
          <button className="w-full rounded-lg bg-emerald-300 px-3 py-2 font-semibold text-slate-900" onClick={askQuestion} disabled={chatBusy}>
            {chatBusy ? 'Asking...' : 'Ask'}
          </button>

          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-sm text-slate-300">{chatAnswer || 'Answers will appear here.'}</p>
            {!!chatSources.length && (
              <div className="mt-2 space-y-1 text-xs text-slate-400">
                {chatSources.map((src) => (
                  <p key={src.sessionId}>{src.sessionId} • Visit {src.visitNumber}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
