'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Settings, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Languages,
  Briefcase,
  User,
  Bot,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';
import Link from 'next/link';
import { ai, INTERVIEW_MODELS } from '@/lib/gemini';
import { Type, Modality } from '@google/genai';

type Message = {
  role: 'interviewer' | 'candidate';
  content: string;
  feedback?: {
    clarity: number;
    grammar: number;
    relevance: number;
    confidence: number;
    suggestions: string[];
  };
};

type InterviewState = 'setup' | 'interviewing' | 'feedback' | 'finished';

export default function InterviewSession() {
  const [state, setState] = useState<InterviewState>('setup');
  const [role, setRole] = useState('');
  const [language, setLanguage] = useState('English');
  const [seniority, setSeniority] = useState('Mid-Level');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [pitch, setPitch] = useState(0); // in cents
  const [bass, setBass] = useState(0); // in dB
  const [treble, setTreble] = useState(0); // in dB
  const [bgMusicVolume, setBgMusicVolume] = useState(0.1);
  const [isBgMusicPlaying, setIsBgMusicPlaying] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgMusicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgMusicGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle Background Music Volume Changes
  useEffect(() => {
    if (bgMusicGainRef.current) {
      bgMusicGainRef.current.gain.setTargetAtTime(bgMusicVolume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [bgMusicVolume]);

  const startBgMusic = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (bgMusicSourceRef.current) return;

    try {
      const response = await fetch('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = bgMusicVolume;
      bgMusicGainRef.current = gainNode;

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start();
      bgMusicSourceRef.current = source;
      setIsBgMusicPlaying(true);
    } catch (err) {
      console.error('Failed to play background music:', err);
    }
  };

  const stopBgMusic = () => {
    if (bgMusicSourceRef.current) {
      bgMusicSourceRef.current.stop();
      bgMusicSourceRef.current = null;
      setIsBgMusicPlaying(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      // Map language names to codes for recognition
      const langMap: Record<string, string> = {
        'English': 'en-US',
        'German': 'de-DE',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'Japanese': 'ja-JP'
      };
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[language] || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        setError("Speech recognition is not supported in this browser.");
      }
    }
  };

  const playAudio = async (text: string) => {
    if (!voiceMode) return;
    
    // Stop any current audio
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
    }

    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const response = await ai.models.generateContent({
        model: INTERVIEW_MODELS.tts,
        contents: [{ parts: [{ text: `Speak naturally in ${language}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Gemini TTS returns 16-bit PCM, mono, 24kHz
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speakingRate;
        source.detune.value = pitch;

        // EQ: Bass
        const bassFilter = audioContextRef.current.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = bass;

        // EQ: Treble
        const trebleFilter = audioContextRef.current.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = treble;

        // Chain: source -> bass -> treble -> destination
        source.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(audioContextRef.current.destination);

        source.onended = () => {
          if (currentSourceRef.current === source) {
            setIsSpeaking(false);
            currentSourceRef.current = null;
          }
        };
        currentSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('TTS Error:', err);
      setIsSpeaking(false);
    }
  };

  const startInterview = async () => {
    if (!role) return;
    setState('interviewing');
    setIsTyping(true);
    
    if (bgMusicVolume > 0) {
      startBgMusic();
    }

    try {
      const systemPrompt = `You are a professional interviewer for a ${seniority} ${role} position. 
      This is a VOICE-BASED interview. 
      The interview is conducted in ${language}. 
      
      Guidelines:
      - Speak in a clear, natural, and conversational tone.
      - Keep responses CONCISE and easy to follow when spoken aloud.
      - Use short sentences suitable for listening, not reading.
      - Avoid bullet points or structured formatting.
      - Ask ONE question at a time and wait for the response.
      - Add natural pauses where appropriate (e.g., "Alright... let's move on.").
      
      IMPORTANT: Respond ONLY in ${language}. Do not translate.
      Start by introducing yourself briefly and asking the first question.`;

      const response = await ai.models.generateContent({
        model: INTERVIEW_MODELS.flash,
        contents: [{ role: 'user', parts: [{ text: "Start the interview." }] }],
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const firstQuestion = response.text || "Hello! Let's get started. Tell me about yourself.";
      setMessages([{ role: 'interviewer', content: firstQuestion }]);
      playAudio(firstQuestion);
    } catch (err) {
      setError("Failed to start the interview. Please check your connection.");
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'candidate', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'interviewer' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const systemPrompt = `You are a professional interviewer for a ${seniority} ${role} position. 
      This is a VOICE-BASED interview in ${language}. 
      Respond ONLY in ${language}.
      
      Guidelines:
      - Be concise. Use short sentences.
      - Ask the next relevant interview question.
      - If the interview has reached a natural conclusion (after 5-7 questions), say "Thank you, that concludes our interview."
      
      Feedback Rule:
      - Before asking the next question, provide a VERY BRIEF spoken feedback on the candidate's last answer (clarity, fluency, relevance).
      - Example: "That was a very clear explanation. Now, let's talk about..."`;

      const nextQuestionResponse = await ai.models.generateContent({
        model: INTERVIEW_MODELS.flash,
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const nextContent = nextQuestionResponse.text || "Thank you, that concludes our interview.";

      // Get structured feedback for the UI
      const feedbackPrompt = `Evaluate the following interview answer for a ${role} position.
      Answer: "${input}"
      Provide feedback in JSON format with:
      - clarity (0-100)
      - grammar (0-100)
      - relevance (0-100)
      - confidence (0-100)
      - suggestions (array of strings in ${language})
      
      Respond ONLY with the JSON object.`;

      const feedbackResponse = await ai.models.generateContent({
        model: INTERVIEW_MODELS.flash,
        contents: [{ role: 'user', parts: [{ text: feedbackPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clarity: { type: Type.NUMBER },
              grammar: { type: Type.NUMBER },
              relevance: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["clarity", "grammar", "relevance", "confidence", "suggestions"]
          }
        }
      });

      const feedbackData = JSON.parse(feedbackResponse.text || '{}');
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].feedback = feedbackData;
        return [...newMessages, { role: 'interviewer', content: nextContent }];
      });

      playAudio(nextContent);

      if (nextContent.toLowerCase().includes("concludes our interview")) {
        setTimeout(() => setState('finished'), 5000);
      }

    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const calculateOverallScore = () => {
    const feedbackMessages = messages.filter(m => m.feedback);
    if (feedbackMessages.length === 0) return 0;
    const total = feedbackMessages.reduce((acc, m) => {
      return acc + (m.feedback!.clarity + m.feedback!.relevance + m.feedback!.confidence) / 3;
    }, 0);
    return Math.round(total / feedbackMessages.length);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 p-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">Interview Session</h1>
              {state === 'interviewing' && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live • {role} ({language})
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state === 'interviewing' && (
              <>
                <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                  <button 
                    onClick={() => setSpeakingRate(0.8)}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${speakingRate === 0.8 ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
                  >
                    Slow
                  </button>
                  <button 
                    onClick={() => setSpeakingRate(1.0)}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${speakingRate === 1.0 ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
                  >
                    Normal
                  </button>
                  <button 
                    onClick={() => setSpeakingRate(1.2)}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${speakingRate === 1.2 ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
                  >
                    Fast
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (isBgMusicPlaying) stopBgMusic();
                    else startBgMusic();
                  }}
                  className={`p-2 rounded-full transition-colors ${isBgMusicPlaying ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'}`}
                  title={isBgMusicPlaying ? "Music On" : "Music Off"}
                >
                  <Music className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setVoiceMode(!voiceMode)}
                  className={`p-2 rounded-full transition-colors ${voiceMode ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}
                  title={voiceMode ? "Voice Mode On" : "Voice Mode Off"}
                >
                  {voiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => {
                    stopBgMusic();
                    setState('finished');
                  }}
                  className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  End Session
                </button>
              </>
            )}
            <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {state === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white p-8 rounded-3xl border-2 border-black neo-shadow w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6" /> Configure Session
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Job Role
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Software Engineer, Marketing Manager"
                      className="w-full bg-zinc-100 border-2 border-transparent focus:border-black rounded-xl px-4 py-3 outline-none transition-all"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <Languages className="w-4 h-4" /> Interview Language
                    </label>
                    <select 
                      className="w-full bg-zinc-100 border-2 border-transparent focus:border-black rounded-xl px-4 py-3 outline-none transition-all"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option>English</option>
                      <option>German</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Japanese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Seniority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Junior', 'Mid-Level', 'Senior'].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setSeniority(lvl)}
                          className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${seniority === lvl ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${voiceMode ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-400'}`}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Voice Mode</div>
                        <div className="text-[10px] text-zinc-500">Speak your answers naturally</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setVoiceMode(!voiceMode)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${voiceMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${voiceMode ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {voiceMode && (
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-sm font-bold flex items-center gap-2">
                            <Volume2 className="w-4 h-4" /> Speaking Rate
                          </label>
                          <span className="text-xs font-bold bg-zinc-200 px-2 py-0.5 rounded">
                            {speakingRate === 0.8 ? 'Slow' : speakingRate === 1.0 ? 'Normal' : 'Fast'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {[0.8, 1.0, 1.2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setSpeakingRate(rate)}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-bold border-2 transition-all ${speakingRate === rate ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}
                            >
                              {rate === 0.8 ? '0.8x' : rate === 1.0 ? '1.0x' : '1.2x'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <label className="text-sm font-bold block mb-4">Voice Customization</label>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 mb-1">
                              <span>Pitch</span>
                              <span>{pitch > 0 ? `+${pitch}` : pitch} cents</span>
                            </div>
                            <input 
                              type="range" min="-500" max="500" step="100"
                              value={pitch} onChange={(e) => setPitch(parseInt(e.target.value))}
                              className="w-full accent-black"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 mb-1">
                                <span>Bass</span>
                                <span>{bass}dB</span>
                              </div>
                              <input 
                                type="range" min="-10" max="10" step="2"
                                value={bass} onChange={(e) => setBass(parseInt(e.target.value))}
                                className="w-full accent-black"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 mb-1">
                                <span>Treble</span>
                                <span>{treble}dB</span>
                              </div>
                              <input 
                                type="range" min="-10" max="10" step="2"
                                value={treble} onChange={(e) => setTreble(parseInt(e.target.value))}
                                className="w-full accent-black"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold">Background Music</label>
                          <span className="text-[10px] font-bold text-zinc-400">{Math.round(bgMusicVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="0.5" step="0.05"
                          value={bgMusicVolume} onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                          className="w-full accent-black"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={startInterview}
                    disabled={!role}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all neo-shadow disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Start Interview
                  </button>
                </div>
              </div>
            </motion.div>
          ) : state === 'finished' ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-6"
            >
              <div className="bg-white p-10 rounded-3xl border-2 border-black neo-shadow w-full max-w-2xl">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Interview Complete!</h2>
                <p className="text-zinc-500 mb-8">Great job practicing for the {role} position.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Overall Score</div>
                    <div className="text-2xl font-bold">{calculateOverallScore()}%</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Questions</div>
                    <div className="text-2xl font-bold">{messages.filter(m => m.role === 'candidate').length}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Language</div>
                    <div className="text-2xl font-bold">{language}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Level</div>
                    <div className="text-2xl font-bold">{seniority}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      setMessages([]);
                      setState('setup');
                    }}
                    className="flex-1 bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all neo-shadow"
                  >
                    <RefreshCw className="w-5 h-5" /> Practice Again
                  </button>
                  <Link 
                    href="/"
                    className="flex-1 bg-white border-2 border-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-4 overflow-hidden"
            >
              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-smooth"
              >
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'candidate' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                      {m.role === 'interviewer' ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Interviewer</span>
                          {i === messages.length - 1 && isSpeaking && (
                            <div className="flex gap-0.5 items-center ml-2">
                              {[1, 2, 3].map(j => (
                                <span key={j} className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: `${j * 0.1}s` }}></span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">You</span>
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${
                      m.role === 'interviewer' 
                        ? 'bg-white border-zinc-200 rounded-tl-none' 
                        : 'bg-zinc-900 text-white border-zinc-800 rounded-tr-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>

                    {/* Feedback Widget */}
                    {m.feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 w-full max-w-[85%] bg-emerald-50 border border-emerald-100 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Real-time Feedback
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600">
                            Score: {Math.round((m.feedback.clarity + m.feedback.relevance + m.feedback.confidence) / 3)}%
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {Object.entries({
                            Clarity: m.feedback.clarity,
                            Grammar: m.feedback.grammar,
                            Relevance: m.feedback.relevance,
                            Confidence: m.feedback.confidence
                          }).map(([key, val]) => (
                            <div key={key} className="text-center">
                              <div className="text-[8px] text-emerald-600 uppercase font-bold">{key}</div>
                              <div className="text-xs font-bold text-emerald-800">{val}%</div>
                            </div>
                          ))}
                        </div>
                        {m.feedback.suggestions.length > 0 && (
                          <div className="text-[10px] text-emerald-700 italic border-t border-emerald-100 pt-2">
                            Tip: {m.feedback.suggestions[0]}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Interviewer is thinking...</span>
                    </div>
                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white border-2 border-black rounded-2xl p-2 flex gap-2 neo-shadow items-center">
                {voiceMode && (
                  <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <input 
                  type="text" 
                  placeholder={isListening ? "Listening..." : "Type your response..."}
                  className="flex-1 px-4 py-3 outline-none text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isTyping || isListening}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isListening}
                  className="bg-black text-white p-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">×</button>
        </div>
      )}
    </div>
  );
}
