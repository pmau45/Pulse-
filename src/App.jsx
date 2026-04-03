import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Clock, ChevronLeft,
  Send, Mic, CheckCircle, X, Users, Camera, ArrowRight,
  Settings as SettingsIcon, AlertTriangle, Radio, Zap, Lock, Trash2,
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSettings } from './hooks/useSettings';
import { storageManager } from './utils/storageManager';
import PhotoGallery from './components/PhotoGallery';
import Settings from './components/Settings';

// --- GEOLOCATION UTILITIES ---
const EARTH_RADIUS_MILES = 3958.8;

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a));
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
    );
  });
}

// --- MOCK DATA ---
const POD_CENTER = { lat: 28.5383, lon: -81.3792 }; // Orlando, FL
const POD_RADIUS_MILES = 25;

// Build Date objects for pod start times (tonight 8 PM and tomorrow noon)
const _tonight8pm = (() => {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return d;
})();

const _tomorrow12pm = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
})();

const UPCOMING_PODS = [
  {
    id: 1,
    title: 'Evening Connection Pod',
    startTime: _tonight8pm,
    radiusMiles: 25,
    joinWindowMinutes: 15,
    chatDurationMinutes: 47,
    spotsLeft: 18,
    joined: 42,
    isLive: true,
    description: 'Wholesome blind chats only — no photos until exchange.',
    bio: 'Connect through voice & deep questions.',
  },
  {
    id: 2,
    title: 'Lunch Break Pod',
    startTime: _tomorrow12pm,
    radiusMiles: 20,
    joinWindowMinutes: 10,
    chatDurationMinutes: 15,
    spotsLeft: 5,
    joined: 95,
    isLive: false,
    description: 'Quick 15-minute blind chats to break up the workday.',
    bio: 'Fast-paced, fun, low pressure.',
  },
];

const MOCK_MATCH = {
  username: 'AlexR28',
  age: 28,
  bio: 'Adventure seeker & coffee addict',
  tagline: 'Love hiking and real conversations',
  qna: [
    { q: "What's your perfect weekend?", a: 'Exploring new trails' },
    { q: 'Dream travel destination?', a: 'Mountains' },
    { q: 'Best date idea?', a: 'Picnic in a park' },
  ],
  revealedImage:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  phone: '(555) 019-2834',
  instagram: '@alex.hikes',
  distance: '2.3',
};

const DEFAULT_FORM = {
  username: '',
  age: '',
  bio: '',
  q1: '',
  q2: '',
  q3: '',
  phone: '',
  instagram: '',
};

// --- APP COMPONENT ---

export default function App() {
  // Run any pending migrations once on mount
  useEffect(() => {
    storageManager.migrateData();
  }, []);

  // --- PERSISTENT STATE (localStorage) ---
  const [userProfile, setUserProfile] = useLocalStorage('pulse_user_profile', null);
  const [currentView, setCurrentView] = useLocalStorage(
    'pulse_app_state',
    storageManager.hasCompletedProfile() ? 'home' : 'welcome',
  );
  const [activePod, setActivePod] = useLocalStorage('pulse_active_pod', null);
  const [chatEndTime, setChatEndTime] = useLocalStorage('pulse_chat_end_time', null);
  const [exchanges, setExchanges] = useLocalStorage('pulse_exchanges', []);
  const [missedConnections, setMissedConnections] = useLocalStorage('pulse_missed_connections', 0);
  const [podsHistory, setPodsHistory] = useLocalStorage('pulse_pods_history', []);
  const [userPhotos, setUserPhotos] = useLocalStorage('pulse_user_photos', []);
  const [settings, setSettings] = useSettings();

  // --- LOCAL STATE ---
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [chatTimer, setChatTimer] = useState(0);
  const [messages, setMessages] = useState([]);
  const [exchangeStatus, setExchangeStatus] = useState('idle');
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showDestructionModal, setShowDestructionModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Keep a ref so timer effect can read latest exchange status without stale closure
  const exchangeStatusRef = useRef(exchangeStatus);
  useEffect(() => {
    exchangeStatusRef.current = exchangeStatus;
  }, [exchangeStatus]);

  // Guard ref so destruction only fires once even though tick runs every second at 0
  const destructionFiredRef = useRef(false);

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (currentView !== 'chat' || !chatEndTime) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((chatEndTime - Date.now()) / 1000));
      setChatTimer(remaining);
      if (
        remaining === 0 &&
        exchangeStatusRef.current !== 'mutual' &&
        !destructionFiredRef.current
      ) {
        destructionFiredRef.current = true;
        setShowDestructionModal(true);
        setMissedConnections((prev) => prev + 1);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setters are stable; exchangeStatusRef tracks latest value
  }, [currentView, chatEndTime]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- HELPERS ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (targetMs) => {
    const diff = Math.max(0, targetMs - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const getTimerWarningLevel = (seconds) => {
    if (seconds > 0 && seconds <= 60) return 'critical';
    if (seconds > 60 && seconds <= 300) return 'warning';
    return null;
  };

  // --- LOCATION ---
  const requestLocationPermission = async () => {
    setIsVerifyingLocation(true);
    setLocationError(null);
    try {
      const loc = await getUserLocation();
      setUserLocation(loc);
      setLocationPermission('granted');
    } catch (err) {
      setLocationPermission('denied');
      setLocationError(err.message || 'Location access denied');
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  const verifyLocationForPod = (pod) => {
    if (!userLocation) return true; // allow if no GPS (graceful fallback)
    const dist = calculateHaversine(
      userLocation.lat, userLocation.lon,
      POD_CENTER.lat, POD_CENTER.lon,
    );
    return dist <= (pod.radiusMiles || POD_RADIUS_MILES);
  };

  const joinPod = (pod) => {
    triggerHaptic();
    // Reset self-destruct guard so it can fire once for this new chat session
    destructionFiredRef.current = false;
    // Show GPS distance if available; 'N/A' otherwise (no mock distance from unrelated data)
    const dist = userLocation
      ? calculateHaversine(
          userLocation.lat, userLocation.lon,
          POD_CENTER.lat, POD_CENTER.lon,
        ).toFixed(1)
      : 'N/A';

    const podWithDistance = { ...pod, distance: dist };
    setActivePod(podWithDistance);

    const durationMs = (pod.chatDurationMinutes || 47) * 60 * 1000;
    const endTime = Date.now() + durationMs;
    setChatEndTime(endTime);
    setChatTimer((pod.chatDurationMinutes || 47) * 60);

    setPodsHistory((prev) => {
      const alreadyJoined = prev.some((p) => p.id === pod.id);
      return alreadyJoined ? prev : [...prev, { ...podWithDistance, joinedAt: Date.now() }];
    });

    setExchangeStatus('idle');
    setShowExchangeModal(false);
    setShowDestructionModal(false);
    setMessages([
      {
        id: 1,
        from: 'match',
        text: 'Hey there!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCurrentView('chat');
  };

  // --- EXCHANGE FLOW ---
  const sendExchangeRequest = () => {
    triggerHaptic();
    setExchangeStatus('pending');
    // Simulate mutual exchange after 3 s
    setTimeout(() => {
      setExchangeStatus('mutual');
      setShowExchangeModal(true);
      setExchanges((prev) => [
        ...prev,
        {
          matchUsername: MOCK_MATCH.username,
          podTitle: activePod?.title,
          exchangedAt: Date.now(),
          phone: MOCK_MATCH.phone,
          instagram: MOCK_MATCH.instagram,
        },
      ]);
    }, 3000);
  };

  const leaveChat = () => {
    setActivePod(null);
    setChatEndTime(null);
    setChatTimer(0);
    setExchangeStatus('idle');
    setShowExchangeModal(false);
    setShowDestructionModal(false);
    setCurrentView('home');
  };

  // --- VIEWS ---

  const renderWelcome = () => (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-white px-6 pt-20 pb-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Radio size={24} className="text-[#FF2D55]" />
          <h1 className="text-4xl font-bold tracking-widest text-[#00E5FF]">PULSE</h1>
          <Zap size={24} className="text-[#FF2D55]" />
        </div>
        <p className="text-gray-400 text-lg mt-2">Real people. Real proximity.</p>
        <p className="text-gray-600 text-sm mt-1">Timed. Blind. Local.</p>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={20} className="text-[#00E5FF]" />
            <span className="font-semibold">Location-Based Pods</span>
          </div>
          <p className="text-gray-400 text-sm">
            Join pods with people near you — verified by real GPS.
          </p>
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-[#FF2D55]" />
            <span className="font-semibold">Timed Chats</span>
          </div>
          <p className="text-gray-400 text-sm">
            Every match has a countdown. Exchange before time runs out.
          </p>
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Lock size={20} className="text-[#00E5FF]" />
            <span className="font-semibold">Blind Until Exchange</span>
          </div>
          <p className="text-gray-400 text-sm">
            Photos &amp; contact info stay locked until you both hit Exchange.
          </p>
        </div>
      </div>

      <button
        onClick={() => setCurrentView('onboarding')}
        className="w-full bg-[#00E5FF] text-black font-bold py-4 rounded-xl text-lg mt-8 hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2"
      >
        Get Started <ArrowRight size={20} />
      </button>
    </div>
  );

  const renderOnboarding = () => {
    const handleNext = () => {
      if (onboardingStep < 3) {
        setOnboardingStep((prev) => prev + 1);
      } else {
        setUserProfile(formData);
        setCurrentView('locationPermission');
        setFormData(DEFAULT_FORM);
      }
    };

    const isStep1Valid = formData.username && formData.age;
    const isStep2Valid = formData.q1 && formData.q2 && formData.q3;
    const isStep3Valid = formData.phone;

    return (
      <div className="flex flex-col h-full bg-[#0A0A0C] text-white px-6 pt-16 pb-8 relative">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-[#00E5FF]">PULSE</h1>
          <div className="text-gray-500 font-medium">Step {onboardingStep} of 3</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-1.5 rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-[#FF2D55] transition-all duration-300"
            style={{ width: `${(onboardingStep / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {onboardingStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-2">Who are you?</h2>
              <p className="text-gray-400 mb-8">Basic info to match you in pods.</p>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">First Name</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
                  placeholder="e.g. Preston"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
                  placeholder="e.g. 26"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Short Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none transition-colors resize-none"
                  placeholder="e.g. Coffee lover & weekend hiker"
                  rows={3}
                />
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-2">The Icebreakers</h2>
              <p className="text-gray-400 mb-8">This is all your match will see at first.</p>

              <div>
                <label className="text-sm text-[#00E5FF] font-medium mb-1 block">
                  What&apos;s your perfect weekend?
                </label>
                <input
                  type="text"
                  value={formData.q1}
                  onChange={(e) => setFormData({ ...formData, q1: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none"
                  placeholder="e.g. Farmers market and a hike"
                />
              </div>
              <div>
                <label className="text-sm text-[#00E5FF] font-medium mb-1 block">
                  Dream travel destination?
                </label>
                <input
                  type="text"
                  value={formData.q2}
                  onChange={(e) => setFormData({ ...formData, q2: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none"
                  placeholder="e.g. Tokyo, Japan"
                />
              </div>
              <div>
                <label className="text-sm text-[#00E5FF] font-medium mb-1 block">
                  Best date idea?
                </label>
                <input
                  type="text"
                  value={formData.q3}
                  onChange={(e) => setFormData({ ...formData, q3: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#00E5FF] focus:outline-none"
                  placeholder="e.g. Grabbing coffee and wandering"
                />
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-2">The Reveal</h2>
              <p className="text-gray-400 mb-8">
                What gets unlocked if you both hit &ldquo;Exchange&rdquo;.
              </p>

              <div>
                <label className="text-sm text-gray-400 mb-3 block">Profile Photos</label>
                <PhotoGallery photos={userPhotos} onPhotosChange={setUserPhotos} />
                <p className="text-xs text-gray-600 mt-2">
                  Photos are locked until both sides exchange info.
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Phone Number (Required)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#FF2D55] focus:outline-none"
                  placeholder="(555) 000-0000"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Instagram Handle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl px-4 py-4 text-white focus:border-[#FF2D55] focus:outline-none"
                  placeholder="@username"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={
            (onboardingStep === 1 && !isStep1Valid) ||
            (onboardingStep === 2 && !isStep2Valid) ||
            (onboardingStep === 3 && !isStep3Valid)
          }
          className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 mt-4 transition-all ${
            (onboardingStep === 1 && isStep1Valid) ||
            (onboardingStep === 2 && isStep2Valid) ||
            (onboardingStep === 3 && isStep3Valid)
              ? 'bg-[#00E5FF] text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {onboardingStep === 3 ? 'Complete Profile' : 'Next'}
          <ArrowRight size={20} />
        </button>
      </div>
    );
  };

  const renderLocationPermission = () => (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-white px-6 pt-20 pb-10 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#1C1C1E] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
          <MapPin size={36} className="text-[#00E5FF]" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Enable Location</h2>
        <p className="text-gray-400 leading-relaxed">
          Pulse uses your GPS to verify you&apos;re within range of the pod.
          Your exact location is never stored or shared.
        </p>
      </div>

      {locationError && (
        <div className="flex items-center gap-2 bg-[#FF2D55]/10 border border-[#FF2D55]/30 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle size={18} className="text-[#FF2D55] shrink-0" />
          <p className="text-[#FF2D55] text-sm">{locationError}</p>
        </div>
      )}

      <div className="mt-auto space-y-4">
        <button
          onClick={async () => {
            await requestLocationPermission();
            setCurrentView('home');
          }}
          disabled={isVerifyingLocation}
          className="w-full bg-[#00E5FF] text-black font-bold py-4 rounded-xl text-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isVerifyingLocation ? 'Verifying...' : 'Allow Location Access'}
          {!isVerifyingLocation && <MapPin size={20} />}
        </button>
        <button
          onClick={() => {
            setLocationPermission('denied');
            setCurrentView('home');
          }}
          className="w-full text-gray-500 font-medium py-3 rounded-xl hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderHome = () => {
    const nextPod = UPCOMING_PODS[0];
    const now = Date.now();
    const podStartMs = nextPod.startTime.getTime();

    return (
      <div className="flex flex-col h-full bg-[#111113] text-white overflow-y-auto pb-20 px-5 pt-12 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-widest text-[#00E5FF]">PULSE</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('settings')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Open settings"
            >
              <SettingsIcon size={22} aria-hidden="true" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
              {userPhotos.length > 0 ? (
                <img src={userPhotos[0]} alt="Self" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                  {userProfile?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-6">
          Hey, {userProfile?.username} 👋
        </h2>

        {/* Next Pod Countdown */}
        <div className="bg-gradient-to-r from-[#1C1C1E] to-[#0A0A0C] rounded-2xl p-5 border border-gray-800 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[#FF2D55]" />
            <span className="text-[#FF2D55] text-sm font-semibold uppercase tracking-wider">
              Next Pod
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-1">{nextPod.title}</h3>
          <p className="text-gray-400 text-sm mb-3">
            {nextPod.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' · '}{nextPod.radiusMiles} mi radius
          </p>
          {nextPod.isLive ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF2D55] animate-pulse" />
              <span className="text-[#FF2D55] text-sm font-bold">LIVE NOW</span>
            </div>
          ) : (
            <p className="text-[#00E5FF] text-sm font-medium">
              Starts in {formatCountdown(podStartMs)}
            </p>
          )}
        </div>

        <p className="text-gray-400 mb-4 border-b border-gray-800 pb-2">
          <span className="font-semibold text-white">Upcoming Pods</span>
          {userLocation ? (
            <span className="text-[#00E5FF] text-xs ml-2">· GPS Active</span>
          ) : (
            <span className="text-gray-600 text-xs ml-2">· Location off</span>
          )}
        </p>

        <div className="space-y-4">
          {UPCOMING_PODS.map((pod) => {
            const podStart = pod.startTime.getTime();
            const joinWindowMs = pod.joinWindowMinutes * 60 * 1000;
            const canJoin = now >= podStart - joinWindowMs && now <= podStart + joinWindowMs;
            const inRange = verifyLocationForPod(pod);

            return (
              <div key={pod.id} className="bg-[#1C1C1E] rounded-2xl p-5 border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium">{pod.title}</h3>
                  {pod.isLive && (
                    <span className="bg-[#FF2D55] text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <Radio size={10} />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-gray-300 font-medium mb-1">
                  {pod.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}{pod.chatDurationMinutes} min chat
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {pod.spotsLeft} spots left · {pod.radiusMiles} mi radius
                </p>
                {pod.isLive || canJoin ? (
                  <>
                    {userLocation && !inRange && (
                      <p className="text-[#FF9500] text-xs mb-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        You appear to be outside the pod radius
                      </p>
                    )}
                    <button
                      onClick={() => joinPod(pod)}
                      className="w-full bg-[#00E5FF] text-black font-semibold py-3 rounded-xl hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap size={16} />
                      Join Pod
                    </button>
                  </>
                ) : (
                  <button className="w-full bg-gray-800 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed">
                    Opens in {formatCountdown(podStart - joinWindowMs)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* My Photos section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-white">My Photos</p>
            <button
              onClick={() => setCurrentView('editPhotos')}
              className="text-xs text-[#00E5FF] hover:underline"
            >
              {userPhotos.length === 0 ? 'Add Photos' : 'Edit'}
            </button>
          </div>
          {userPhotos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {userPhotos.map((src, idx) => (
                <div
                  key={idx}
                  className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-800"
                >
                  <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('editPhotos')}
              className="w-full bg-[#1C1C1E] border border-dashed border-gray-700 rounded-xl py-4 text-gray-500 text-sm flex items-center justify-center gap-2 hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors"
            >
              <Camera size={18} aria-hidden="true" />
              Upload photos to show after exchange
            </button>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 w-full bg-[#0A0A0C] border-t border-gray-800 flex justify-between items-center p-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-xl">
            <MapPin size={24} className="text-[#00E5FF]" />
          </div>
          <div className="text-gray-500 font-medium">
            {missedConnections > 0 ? `${missedConnections} missed` : 'My Past Pods'}
          </div>
        </div>
      </div>
    );
  };

  const renderChat = () => {
    const warningLevel = getTimerWarningLevel(chatTimer);
    const timerColor =
      warningLevel === 'critical' ? '#FF2D55' : warningLevel === 'warning' ? '#FF9500' : '#FFFFFF';

    return (
      <div className="flex flex-col h-full bg-[#111113] text-white relative animate-fade-in">
        {/* Header / Timer */}
        <div className="pt-12 pb-4 px-5 flex justify-between items-start border-b border-gray-800 bg-[#0A0A0C] shadow-lg z-10">
          <h1 className="text-xl font-bold tracking-widest text-white">PULSE</h1>
          <div className="text-center">
            <div className="text-4xl font-light tracking-tight" style={{ color: timerColor }}>
              {formatTime(chatTimer)}
            </div>
            <div className="text-sm font-medium" style={{ color: timerColor }}>
              {warningLevel === 'critical' ? 'exchange now!' : 'remaining'}
            </div>
          </div>
          <button
            className="p-2 text-gray-400 hover:text-white transition-colors"
            onClick={leaveChat}
            aria-label="Leave chat"
          >
            <X size={24} />
          </button>
        </div>

        {/* Timer warning banner */}
        {warningLevel && (
          <div
            className={`px-5 py-2 flex items-center gap-2 ${
              warningLevel === 'critical' ? 'bg-[#FF2D55]/20' : 'bg-[#FF9500]/20'
            }`}
          >
            <AlertTriangle
              size={16}
              className={warningLevel === 'critical' ? 'text-[#FF2D55]' : 'text-[#FF9500]'}
            />
            <span className="text-sm font-medium">
              {warningLevel === 'critical'
                ? 'Less than 1 minute! Exchange now or this chat disappears.'
                : '5 minutes left — consider exchanging info!'}
            </span>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-36">
          {/* Blind Profile Summary */}
          <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center">
                <Users size={20} className="text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  Matched in {activePod?.title?.split(' ')[0]} Pod
                </h3>
                <p className="text-gray-400 text-sm">
                  {MOCK_MATCH.username} · {MOCK_MATCH.age}
                  {activePod?.distance && activePod.distance !== 'N/A'
                    ? ` · ${activePod.distance} mi`
                    : ''}
                </p>
              </div>
            </div>
            <p className="text-gray-300 font-medium mb-1">{MOCK_MATCH.tagline}</p>
            <p className="text-gray-500 text-sm mb-4">{MOCK_MATCH.bio}</p>
            <div className="space-y-3">
              {MOCK_MATCH.qna.map((item, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-[#0A0A0C] p-3 rounded-lg border border-gray-800"
                >
                  <span className="font-semibold text-[#00E5FF] block mb-1">{item.q}</span>
                  <span className="text-gray-300">{item.a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {messages.map((msg) =>
              msg.from === 'match' ? (
                <div key={msg.id} className="flex">
                  <div className="bg-[#2C2C2E] text-white px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm shadow-sm">
                    {msg.text}
                    <span className="text-gray-500 text-xs ml-2">{msg.time}</span>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-[#3A3A3C] text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                    {msg.text}
                    <span className="text-gray-500 text-xs ml-2">{msg.time}</span>
                  </div>
                </div>
              ),
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input & Action Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-[#0A0A0C] border-t border-gray-800 backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newMessage.trim()) {
                  const time = new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  setMessages((prev) => [
                    ...prev,
                    { id: Date.now(), from: 'me', text: newMessage.trim(), time },
                  ]);
                  setNewMessage('');
                }
              }}
              className="flex-1 bg-[#1C1C1E] border border-gray-700 rounded-full px-4 py-3 text-white text-sm focus:border-[#00E5FF] focus:outline-none"
              placeholder="Type a message..."
            />
            <button
              onClick={() => {
                if (!newMessage.trim()) return;
                const time = new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                setMessages((prev) => [
                  ...prev,
                  { id: Date.now(), from: 'me', text: newMessage.trim(), time },
                ]);
                setNewMessage('');
              }}
              className="bg-[#00E5FF] p-3 rounded-full text-black shrink-0 hover:bg-cyan-400 transition-colors"
            >
              <Send size={18} />
            </button>
            <button
              onClick={() => setIsRecording((r) => !r)}
              className={`p-3 rounded-full shrink-0 transition-colors ${
                isRecording ? 'bg-[#FF2D55] text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              <Mic size={20} />
            </button>
          </div>
          <button
            onClick={sendExchangeRequest}
            disabled={exchangeStatus === 'pending' || exchangeStatus === 'mutual'}
            className={`w-full font-bold py-4 rounded-full text-lg transition-colors ${
              exchangeStatus === 'pending'
                ? 'bg-gray-700 text-gray-400 cursor-wait'
                : exchangeStatus === 'mutual'
                ? 'bg-[#30D158] text-black'
                : 'bg-[#FF2D55] text-white hover:bg-pink-600 shadow-[0_0_15px_rgba(255,45,85,0.4)]'
            }`}
          >
            {exchangeStatus === 'pending'
              ? 'Waiting for match...'
              : exchangeStatus === 'mutual'
              ? 'Exchanged! ✓'
              : 'Exchange Info'}
          </button>
        </div>

        {/* Exchange Success Modal */}
        {showExchangeModal && (
          <div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#1C1C1E] border border-gray-700 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
              {/* Confetti decorations */}
              <div className="absolute top-4 left-4 w-2 h-4 bg-cyan-400 rotate-45 rounded-sm" />
              <div className="absolute top-10 right-8 w-3 h-3 bg-pink-500 rounded-full" />
              <div className="absolute top-20 left-10 w-4 h-2 bg-purple-400 -rotate-12 rounded-sm" />
              <div className="absolute bottom-20 right-10 w-2 h-6 bg-yellow-400 rotate-45 rounded-sm" />

              <h2 className="text-3xl font-bold text-[#00E5FF] mb-6">Info Exchanged!</h2>

              <div className="w-20 h-20 bg-[#30D158] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(48,209,88,0.4)]">
                <CheckCircle size={40} className="text-[#0A0A0C]" />
              </div>

              <p className="text-gray-300 mb-8 leading-relaxed">
                You connected before time ran out &mdash;<br />
                this match is now saved forever.
              </p>

              <h3 className="font-semibold text-white mb-4">Unlocked Profile</h3>

              <div className="relative mb-4">
                <img
                  src={MOCK_MATCH.revealedImage}
                  alt="Match"
                  className="w-24 h-24 rounded-full border-4 border-[#1C1C1E] shadow-lg object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-[#30D158] rounded-full p-1 border-2 border-[#1C1C1E]">
                  <CheckCircle size={14} className="text-[#0A0A0C]" />
                </div>
              </div>

              <p className="text-white font-medium text-lg">{MOCK_MATCH.phone}</p>
              <p className="text-gray-400 text-sm mb-8">Instagram {MOCK_MATCH.instagram}</p>

              <button
                onClick={() => setShowExchangeModal(false)}
                className="w-full bg-[#FF2D55] text-white font-bold py-4 rounded-full mb-3 shadow-lg hover:bg-pink-600 transition-colors"
              >
                Keep Chatting
              </button>
              <button
                onClick={leaveChat}
                className="w-full text-gray-500 font-medium py-3 rounded-full hover:text-white transition-colors"
              >
                Back to Pods
              </button>
            </div>
          </div>
        )}

        {/* Self-Destruct Modal */}
        {showDestructionModal && (
          <div className="absolute inset-0 bg-[#0A0A0C]/95 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#1C1C1E] border border-[#FF2D55]/30 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
              <div className="w-20 h-20 bg-[#FF2D55]/20 rounded-full flex items-center justify-center mb-6">
                <Trash2 size={36} className="text-[#FF2D55]" />
              </div>

              <h2 className="text-3xl font-bold text-[#FF2D55] mb-3">Chat Destroyed</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Time ran out before an exchange was made.<br />
                This conversation has been permanently deleted.
              </p>

              <button
                onClick={leaveChat}
                className="w-full bg-[#FF2D55] text-white font-bold py-4 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
              >
                Back to Pods
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center font-sans overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      {/* Mobile Constraint Wrapper */}
      <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] sm:border-[8px] border-gray-900 relative overflow-hidden shadow-2xl">
        {currentView === 'welcome' && renderWelcome()}
        {currentView === 'onboarding' && renderOnboarding()}
        {currentView === 'locationPermission' && renderLocationPermission()}
        {currentView === 'home' && userProfile && renderHome()}
        {currentView === 'chat' && activePod && renderChat()}
        {currentView === 'settings' && (
          <Settings
            settings={settings}
            onSettingsChange={setSettings}
            onBack={() => setCurrentView('home')}
            onClearData={() => {
              storageManager.clearAllData();
              window.location.reload();
            }}
          />
        )}
        {currentView === 'editPhotos' && (
          <div className="flex flex-col h-full bg-[#0A0A0C] text-white overflow-y-auto animate-fade-in">
            <div className="flex items-center gap-3 px-5 pt-12 pb-6 border-b border-gray-800">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-wide">My Photos</h1>
            </div>
            <div className="flex-1 px-5 py-6">
              <p className="text-gray-400 text-sm mb-6">
                These photos are revealed to your match after both sides exchange info.
              </p>
              <PhotoGallery photos={userPhotos} onPhotosChange={setUserPhotos} />
            </div>
          </div>
        )}
        {/* Fallback: redirect stale 'detail' view state to home */}
        {currentView === 'detail' && userProfile && renderHome()}
      </div>
    </div>
  );
}
