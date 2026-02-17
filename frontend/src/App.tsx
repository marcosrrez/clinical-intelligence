import { useState } from 'react';
import { Activity, ShieldAlert, FileText, Send, Database, CheckCircle2, AlertTriangle, TrendingUp, Target, Brain, RefreshCcw, Building, Mic, Square, Lock } from 'lucide-react';
import axios from 'axios';
import ClientHistory from './components/ClientHistory';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  risk_assessment: string;
}

interface Audit {
  liability_flags: string[];
  clinical_clarity_score: number;
  suggestions: string[];
  risk_level: 'Low' | 'Medium' | 'High';
}

interface Markers {
  primary_themes: string[];
  emotional_intensity: number;
  goal_progress: number;
  risk_score: number;
}

interface ClinicalOutput {
  structured_note: SoapNote;
  audit: Audit;
  markers: Markers;
}

function App() {
  const { user } = useUser();
  const [view, setView] = useState<'new_session' | 'history'>('new_session');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [result, setResult] = useState<ClinicalOutput | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav');
        
        setLoading(true);
        try {
          const response = await axios.post('http://localhost:8000/session/transcribe', formData);
          setRawText(prev => prev + " " + response.data.transcript);
        } catch (err) {
          console.error("Transcription failed", err);
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const processNote = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/session/process', {
        org_id: 'default_org',
        client_id: 'client_123',
        raw_text: rawText
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error processing note", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    if (!result) return;
    try {
      await axios.post('http://localhost:8000/session/save', {
        org_id: 'default_org',
        client_id: 'client_123',
        session_id: `sess_${Date.now()}`,
        text: rawText,
        structured_json: JSON.stringify(result.structured_note),
        metadata: {
            risk_level: result.audit.risk_level,
            author: user?.fullName
        },
        markers: result.markers
      });
      alert("Session Encrypted & Saved!");
      setRawText('');
      setResult(null);
      setView('history');
    } catch (error) {
      console.error("Save failed", error);
    }
  }

  const syncKB = async () => {
    setSyncing(true);
    try {
      await axios.post('http://localhost:8000/org/default_org/sync_kb');
      alert("Knowledge Base Synced!");
    } catch (error) {
      console.error("Error syncing KB", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <SignedOut>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
          <Activity className="text-emerald-400 mb-6 w-16 h-16" />
          <h1 className="text-4xl font-black tracking-tight mb-4">Clinical Intelligence Infrastructure</h1>
          <p className="max-w-md text-slate-400 mb-8 leading-relaxed">
            The secure reasoning augmentation layer for modern clinical therapists. 
            Sign in to access encrypted longitudinal records and reflective audit tools.
          </p>
          <SignInButton mode="modal">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-xl shadow-emerald-900/40 flex items-center gap-2">
              <Lock size={18} />
              Clinician Sign In
            </button>
          </SignInButton>
          <div className="mt-12 flex gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>HIPAA Compliant</span>
            <span>AES-256 Encrypted</span>
            <span>Multi-Agent Reasoning</span>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white flex flex-col p-6 shrink-0">
          <div className="flex items-center gap-3 mb-10">
            <Activity className="text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Clinical Intel</h1>
          </div>
          
          <nav className="flex-1 space-y-4">
            <button onClick={() => setView('history')} className={`flex items-center gap-3 w-full text-left transition p-2 rounded-lg ${view === 'history' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'}`}>
              <Database size={20} />
              <span>Client History</span>
            </button>
            <button onClick={() => setView('new_session')} className={`flex items-center gap-3 w-full text-left transition p-2 rounded-lg ${view === 'new_session' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'}`}>
              <FileText size={20} />
              <span>New Session</span>
            </button>
            <button className="flex items-center gap-3 text-slate-300 hover:text-white transition p-2 w-full text-left">
              <ShieldAlert size={20} />
              <span>Risk Monitor</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
            <button 
              onClick={syncKB}
              disabled={syncing}
              className="flex items-center gap-3 text-slate-400 hover:text-white transition w-full text-left"
            >
              <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
              <span>Sync Knowledge Base</span>
            </button>
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate">{user?.fullName || user?.username}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Horizon Therapy</span>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-700">
                  {view === 'new_session' ? 'New Session Documentation' : 'Longitudinal Client History'}
              </h2>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2 text-slate-400">
                <Building size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Default Org Context</span>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Ollama Active
              </span>
            </div>
          </header>

          {view === 'history' ? (
              <ClientHistory />
          ) : (
              <main className="flex-1 overflow-auto p-8 flex gap-8">
              {/* Input Area */}
              <div className="flex-1 flex flex-col gap-6 min-w-[400px]">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Raw Session Transcript / Notes</label>
                      <button 
                          onClick={recording ? stopRecording : startRecording}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              recording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                          {recording ? <Square size={12} fill="currentColor" /> : <Mic size={12} />}
                          {recording ? 'STOP RECORDING' : 'RECORD SESSION'}
                      </button>
                  </div>
                  <textarea 
                      className="flex-1 resize-none border-none focus:ring-0 text-slate-700 placeholder-slate-300 text-lg leading-relaxed bg-transparent"
                      placeholder="Start typing or paste session transcript here..."
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                  />
                  <button 
                      onClick={processNote}
                      disabled={loading || !rawText}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
                  >
                      {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                      <>
                          <Send size={18} />
                          <span>Generate Clinical Reasoning</span>
                      </>
                      )}
                  </button>
                  </div>
              </div>

              {/* Output Area */}
              <div className="w-[600px] flex flex-col gap-6 overflow-y-auto pr-2 pb-8">
                  {result ? (
                  <>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <TrendingUp size={14} className="text-emerald-500" />
                          Clinical Trend Analysis
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-2">
                              <Brain size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Emotional</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{result.markers.emotional_intensity}/10</div>
                          <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{width: `${result.markers.emotional_intensity * 10}%`}}></div>
                          </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-2">
                              <Target size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Progress</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{result.markers.goal_progress}/10</div>
                          <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{width: `${result.markers.goal_progress * 10}%`}}></div>
                          </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-2">
                              <ShieldAlert size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Risk</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{result.markers.risk_score}/10</div>
                          <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{width: `${result.markers.risk_score * 10}%`}}></div>
                          </div>
                          </div>
                      </div>
                      </div>

                      <div className={`rounded-2xl border p-6 transition-all shadow-sm ${
                      result.audit.risk_level === 'High' ? 'bg-red-50 border-red-200' : 
                      result.audit.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4 ${
                          result.audit.risk_level === 'High' ? 'text-red-600' : 
                          result.audit.risk_level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                          <ShieldAlert size={16} />
                          Reflective Audit: {result.audit.risk_level} Risk
                      </h3>
                      {result.audit.liability_flags.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-red-900 bg-red-100/50 p-2 rounded-md mb-2">
                              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                              <span>{flag}</span>
                          </div>
                      ))}
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                          Structured Clinical Note
                          <button onClick={saveSession} className="text-emerald-600 hover:text-emerald-700 font-bold hover:bg-emerald-50 px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 border border-emerald-100">
                          <CheckCircle2 size={14} />
                          Approve & Save
                          </button>
                      </h3>
                      {Object.entries(result.structured_note).map(([key, value]) => (
                          <div key={key}>
                              <h4 className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest opacity-30">{key}</h4>
                              <div className="text-[15px] text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">{value}</div>
                          </div>
                      ))}
                      </div>
                  </>
                  ) : (
                  <div className="flex-1 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                      <FileText size={48} className="mb-6 opacity-10" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Clinical Reasoning Engine</h3>
                      <p className="max-w-xs text-sm text-slate-500">Submit session raw notes to initiate the reflective multi-agent audit loop.</p>
                  </div>
                  )}
              </div>
              </main>
          )}
        </div>
      </SignedIn>
    </div>
  );
}

export default App;
