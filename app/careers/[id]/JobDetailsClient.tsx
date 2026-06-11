'use client';

import { useEffect, useState, useMemo, useRef, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import Navbar from '@/components/Navbar/Navbar';

interface Vacancy {
  _id: string;
  title: string;
  description: string;
  salary?: string;
  locations: string[];
  transportProvided: boolean;
  accommodationProvided: boolean;
  accommodationDetails?: string;
}

const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka', dial: '+94' },
  { code: 'US', name: 'USA', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'RU', name: 'Russia', dial: '+7' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'MV', name: 'Maldives', dial: '+960' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'ID', name: 'Indonesia', dial: '+62' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'AE', name: 'UAE', dial: '+971' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
];

export default function JobDetailsClient({ id }: { id: string }) {
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ referenceId: string; title: string } | null>(null);

  const router = useRouter();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_say'>('prefer_not_say');
  const [address, setAddress] = useState('');
  const [hasExperience, setHasExperience] = useState(false);
  const [experienceYears, setExperienceYears] = useState('');
  const [referred, setReferred] = useState(false);
  const [refereeName, setRefereeName] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [refereeMobile, setRefereeMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+94');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState<File | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useEffect(() => {
    const fetchVacancyDetails = async () => {
      try {
        const res = await fetch(`/api/careers/${id}`);
        if (!res.ok) throw new Error('Job posting not found');
        const data = await res.json();
        if (data.success) {
          setVacancy(data.data);
        }
      } catch (err) {
        console.error('Job details loading error:', err);
        toast.error('Failed to load vacancy specifications.');
      } finally {
        setLoading(false);
      }
    };
    fetchVacancyDetails();
  }, [id]);

  // Sync country selection with dialing code
  const handleCountryChange = (cName: string) => {
    setCountry(cName);
    const match = COUNTRIES.find(c => c.name === cName);
    if (match) {
      setDialCode(match.dial);
    }
  };

  // Real-time Age calculation
  const calculatedAge = useMemo(() => {
    if (!dob) return null;
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dob]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Unsupported format! Resumes must be PDF or DOCX format.');
        e.target.value = '';
        setResume(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large! Max file limit is 5MB.');
        e.target.value = '';
        setResume(null);
        return;
      }
      setResume(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast.error('Please complete the security check');
      return;
    }

    if (!resume) {
      toast.error('Please upload your Resume/CV document.');
      return;
    }

    if (calculatedAge !== null && calculatedAge < 16) {
      toast.error('Applicants must be at least 16 years old.');
      return;
    }

    if (hasExperience) {
      const expNum = parseInt(experienceYears);
      if (isNaN(expNum) || expNum < 0 || expNum > 99) {
        toast.error('Years of experience must be a 2-digit positive integer.');
        return;
      }
    }

    if (referred && !refereeName) {
      toast.error('Please enter the referee name.');
      return;
    }

    setSubmitting(true);
    const loadToast = toast.loading('Submitting application details...');

    try {
      const dataPayload = new FormData();
      dataPayload.append('vacancyId', id);
      dataPayload.append('firstName', firstName);
      dataPayload.append('lastName', lastName);
      dataPayload.append('country', country);
      dataPayload.append('city', city);
      dataPayload.append('dob', dob);
      dataPayload.append('gender', gender);
      dataPayload.append('address', address);
      dataPayload.append('hasExperience', String(hasExperience));
      if (hasExperience) {
        dataPayload.append('experienceYears', experienceYears);
      }
      dataPayload.append('referred', String(referred));
      if (referred) {
        dataPayload.append('refereeName', refereeName);
        dataPayload.append('refereeEmail', refereeEmail);
        dataPayload.append('refereeMobile', refereeMobile);
      }
      dataPayload.append('email', email);
      dataPayload.append('mobile', `${dialCode} ${phone}`);
      dataPayload.append('resume', resume);
      dataPayload.append('turnstileToken', turnstileToken);

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        body: dataPayload,
      });

      const resJson = await res.json();

      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to submit application.');
      }

      toast.success('Application submitted successfully!', { id: loadToast });
      setSuccessData({
        referenceId: resJson.referenceId,
        title: vacancy?.title || 'Selected Position',
      });
    } catch (error: any) {
      toast.error(error.message || 'Submission failed.', { id: loadToast });
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f0] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-[#faf7f0] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 font-['Jost']">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <h2 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#1a1209]">Position Unavailable</h2>
          <p className="text-sm text-[#1a1209]/60 mt-1 max-w-sm text-center">
            This job vacancy is either filled, deactivated, or does not exist in our system.
          </p>
          <Link href="/careers" className="mt-6 px-5 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors">
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  const hasMultipleLocations = vacancy.locations?.length > 1;

  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1a1209] font-['Jost'] flex flex-col mt-[72px] lg:mt-[86px]">
      <Navbar />
      <Toaster position="top-right" />

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1209]/70 backdrop-blur-md">
          <div className="bg-white border border-[#8B6914]/35 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-5 animate-scaleUp">
            <div className="w-16 h-16 bg-[#8B6914]/10 rounded-full border border-[#8B6914]/30 flex items-center justify-center text-3xl text-[#8B6914] mx-auto animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-semibold">Application Received</h2>
              <p className="text-xs text-[#8B6914] font-medium uppercase tracking-wider">
                {successData.title}
              </p>
            </div>
            <p className="text-sm text-[#1a1209]/60 leading-relaxed">
              Your credentials and resume have been securely received. Our recruitment team will review your application and follow up via email.
            </p>
            <div className="bg-[#faf7f0] border border-[#1a1209]/10 rounded-xl p-4.5 space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#1a1209]/40">Application Reference ID</p>
              <p className="font-mono text-base font-semibold tracking-wider text-[#1a1209] select-all">
                {successData.referenceId}
              </p>
            </div>
            <button
              onClick={() => router.push('/careers')}
              className="w-full py-3 bg-[#1a1209] hover:bg-[#8B6914] text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-all shadow-md"
            >
              Back to Careers Catalog
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Info Details (Left) + Form Details (Right) */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Job Description Spec details */}
        <section className="lg:col-span-5 space-y-8">
          
          {/* Back Button */}
          <Link href="/careers" className="inline-flex items-center gap-1.5 text-xs text-[#8B6914] hover:text-[#1a1209] transition-colors font-medium">
            <span>←</span> <span>Back to Open Positions</span>
          </Link>

          {/* Heading Card */}
          <div className="space-y-4">
            <h1 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-bold leading-tight">
              {vacancy.title}
            </h1>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {vacancy.locations.map(loc => (
                <span key={loc} className="px-2.5 py-1 bg-white border border-[#1a1209]/10 text-xs font-medium rounded-lg text-[#1a1209]/80 uppercase tracking-wide shadow-sm">
                  📍 {loc}
                </span>
              ))}
            </div>

            {vacancy.salary && (
              <p className="text-base text-[#8B6914] font-semibold">
                Starting Salary: {vacancy.salary}
              </p>
            )}
          </div>

          {/* Maison Special Features (Transport, Accommodation) */}
          <div className="bg-white border border-[#1a1209]/10 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-['Cormorant_Garamond'] text-lg font-bold border-b border-[#1a1209]/5 pb-2">
              Employment Package Perks
            </h3>

            {hasMultipleLocations && (
              <div className="flex items-start gap-3 text-xs leading-relaxed text-[#1a1209]/75">
                <span className="text-base">🔄</span>
                <div>
                  <span className="font-semibold block text-[#8B6914] uppercase tracking-wide text-[9px] mb-0.5">Rotational Branches Policy</span>
                  As we run multiple branch showrooms, watchmaking staff may undergo scheduled rotations across locations. 
                  {vacancy.transportProvided ? (
                    <strong className="block text-[#1a1209] mt-1">✓ Company provides full transport expenses reimbursement.</strong>
                  ) : (
                    <span className="block text-[#1a1209]/50 mt-1">*Rotational transport expenses covered locally.</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 text-xs leading-relaxed text-[#1a1209]/75">
              <span className="text-base">🏨</span>
              <div>
                <span className="font-semibold block text-[#8B6914] uppercase tracking-wide text-[9px] mb-0.5">Accommodation Facilities</span>
                {vacancy.accommodationProvided ? (
                  <>
                    <strong className="text-green-700 block mb-1">Accommodation Provided by Maison</strong>
                    {vacancy.accommodationDetails && (
                      <p className="text-[#1a1209]/70 bg-[#faf7f0] p-2.5 rounded-lg border border-[#1a1209]/5 mt-1 font-light italic">
                        "{vacancy.accommodationDetails}"
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[#1a1209]/50">Company accommodation is not offered for this role.</p>
                )}
              </div>
            </div>
          </div>

          {/* Description details content */}
          <div className="space-y-3">
            <h3 className="font-['Cormorant_Garamond'] text-xl font-bold">
              Job Description & Responsibilities
            </h3>
            <div 
              className="text-sm text-[#1a1209]/80 leading-relaxed space-y-4 font-light text-justify"
              dangerouslySetInnerHTML={{ __html: vacancy.description }}
            />
          </div>

        </section>

        {/* Right Column: Application Form */}
        <section className="lg:col-span-7 bg-white border border-[#1a1209]/10 rounded-3xl p-6 lg:p-10 shadow-xl h-fit">
          <div className="border-b border-[#1a1209]/10 pb-5 mb-7">
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold">Submit Application</h2>
            <p className="text-xs text-[#1a1209]/50 mt-1">Please fill in your exact details as they appear on official identity credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            {/* Country, City, Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Country</label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] appearance-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                  placeholder="e.g. Colombo"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Residential Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                placeholder="Street address, apartment, suite..."
              />
            </div>

            {/* DOB, Age, Gender */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Age (Auto-calculated)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={calculatedAge !== null ? `${calculatedAge} years` : 'Enter DOB first'}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#1a1209]/10 rounded-xl text-sm text-[#1a1209]/60 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Gender</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] appearance-none cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_say">Prefer not to say</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                </div>
              </div>
            </div>

            {/* Experience Toggles */}
            <div className="bg-[#faf7f0]/40 border border-[#1a1209]/5 rounded-2xl p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExperience}
                  onChange={(e) => setHasExperience(e.target.checked)}
                  className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#1a1209] uppercase tracking-wide">
                  I possess relevant professional experience
                </span>
              </label>

              {hasExperience && (
                <div className="animate-fadeIn pl-7">
                  <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-1.5">Years of Experience (2 digits)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value.slice(0, 2))}
                    className="w-[120px] px-4 py-2 bg-white border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914]"
                    placeholder="e.g. 5"
                  />
                </div>
              )}
            </div>

            {/* Referral Toggles */}
            <div className="bg-[#faf7f0]/40 border border-[#1a1209]/5 rounded-2xl p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={referred}
                  onChange={(e) => setReferred(e.target.checked)}
                  className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#1a1209] uppercase tracking-wide">
                  I was referred by an existing Winsor employee
                </span>
              </label>

              {referred && (
                <div className="animate-fadeIn pl-7 space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-1.5">Referee Full Name</label>
                    <input
                      type="text"
                      required
                      value={refereeName}
                      onChange={(e) => setRefereeName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914]"
                      placeholder="e.g. Nimal Perera"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-1.5">Referee Email (Optional)</label>
                      <input
                        type="email"
                        value={refereeEmail}
                        onChange={(e) => setRefereeEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914]"
                        placeholder="nimal@winsor.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-1.5">Referee Mobile (Optional)</label>
                      <input
                        type="text"
                        value={refereeMobile}
                        onChange={(e) => setRefereeMobile(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914]"
                        placeholder="+94 77 123 4567"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Applicant Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">Applicant Mobile Number</label>
                <div className="flex gap-2">
                  <div className="relative w-[100px] flex-shrink-0">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] appearance-none cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.code} ({c.dial})
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[9px]">▼</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm focus:outline-none focus:border-[#8B6914] transition"
                    placeholder="771234567"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-[10px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">
                Upload Resume / CV (PDF or DOCX, Max 5MB)
              </label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#8B6914]/10 file:text-[#8B6914] hover:file:bg-[#8B6914]/20 cursor-pointer file:cursor-pointer"
              />
            </div>

            {/* Turnstile Verification */}
            <div className="flex justify-center pt-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'light', size: 'flexible' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={Boolean(submitting || !turnstileToken)}
              className="w-full py-4 bg-gradient-to-r from-[#1a1209] to-[#2a1d10] hover:from-[#2a1d10] hover:to-[#3a2815] text-white text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Application…' : 'Submit Application'}
            </button>

          </form>
        </section>

      </main>

      {/* CSS overrides for scale animations */}
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
}
