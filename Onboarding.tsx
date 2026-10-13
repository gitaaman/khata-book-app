import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiPlus, FiDownloadCloud, FiFolder, FiUser, FiPhone, FiSmartphone, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useKhata } from './KhataContext';
import { useToast } from './ToastContext';
import { PermissionsModal } from './PermissionsModal';

export const Onboarding: React.FC = () => {
  const { createShop, importBackup } = useKhata();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'choose' | 'create_form'>('choose');
  const [showPermissions, setShowPermissions] = useState(false);

  // Form State
  const [shopName, setShopName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [theme, setTheme] = useState('royal-blue');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically sync folder name when shop name changes
  const handleShopNameChange = (val: string) => {
    setShopName(val);
    if (!folderName || folderName === shopName.replace(/[^\w\u0900-\u097F]/g, '_')) {
      setFolderName(val.trim().replace(/[^\w\u0900-\u097F]/g, '_'));
    }
  };

  const handleStartCreate = () => {
    // Show permissions first if not granted
    const hasGranted = localStorage.getItem('kb_permissions_granted');
    if (!hasGranted) {
      setShowPermissions(true);
    } else {
      setStep('create_form');
    }
  };

  const handleGrantPermissions = () => {
    localStorage.setItem('kb_permissions_granted', 'true');
    setShowPermissions(false);
    setStep('create_form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showToast('कृपया दुकान या व्यापार का नाम दर्ज करें', 'error');
      return;
    }
    if (!ownerName.trim()) {
      showToast('कृपया अपना नाम दर्ज करें', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('कृपया मोबाइल नंबर दर्ज करें', 'error');
      return;
    }

    setLoading(true);
    try {
      await createShop({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        upiId: upiId.trim() || undefined,
        folderName: (folderName.trim() || shopName.trim()).replace(/[^\w\u0900-\u097F]/g, '_'),
        theme,
      });

      showToast(`खाता बुक शुरू हो गई! फ़ोल्डर "${folderName || shopName}" तैयार है।`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast('खाता शुरू करने में त्रुटि: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Import Backup JSON File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      await importBackup(text);
      showToast('पुराना डेटा सफलतापूर्वक लोड हो गया! सभी ग्राहक और हिसाब रीस्टोर हो गए।', 'success');
      navigate('/');
    } catch (err: any) {
      showToast('बैकअप फाइल पढ़ने में समस्या: ' + err.message, 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <PermissionsModal isOpen={showPermissions} onGrant={handleGrantPermissions} />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Header Banner */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <FiBook className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">खाता बुक (Khata Book)</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            100% ऑफ़लाइन डिजिटल बही-खाता • किराना, कपड़ा, हार्डवेयर या किसी भी व्यापार हेतु
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'choose' ? (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-base font-black text-slate-800">
                    आप कैसे शुरुआत करना चाहते हैं?
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    नया खाता बनाएं या किसी दूसरे फोन से निकाला हुआ बैकअप लोड करें
                  </p>
                </div>

                {/* Option 1: Create New */}
                <button
                  onClick={handleStartCreate}
                  className="w-full p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 hover:bg-blue-50 text-left flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-500/20">
                    <FiPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-blue-950">
                      1. नया खाता शुरू करें (Create New Khata)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      अपनी दुकान/व्यापार का नाम, मोबाइल नंबर और UPI ID डालकर तुरंत नई बही-खाता डायरी बनाएं।
                    </p>
                  </div>
                </button>

                {/* Option 2: Import Backup */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-left flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                    <FiDownloadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      2. पुराना बैकअप लोड करें (Import Old Khata)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      पुराने फोन से सेव की हुई बैकअप फाइल (.json) चुनें। सारे ग्राहक, बिल और हिसाब तुरंत वापस आ जाएंगे।
                    </p>
                  </div>
                </button>

                <div className="pt-2 text-center text-[11px] font-bold text-slate-400">
                  🔒 बिना इंटरनेट के 100% ऑफ़लाइन काम करता है
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="create_form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleFormSubmit}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" /> वापस जाएं
                  </button>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                    नया खाता विवरण
                  </span>
                </div>

                {/* Shop / Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    दुकान / व्यापार का नाम *
                  </label>
                  <div className="relative">
                    <FiBook className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="उदा. श्री श्याम वस्त्र भंडार / किराना स्टोर"
                      value={shopName}
                      onChange={(e) => handleShopNameChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Folder Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    फ़ोल्डर का नाम (मोबाइल स्टोरेज में बैकअप हेतु)
                  </label>
                  <div className="relative">
                    <FiFolder className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="फ़ोल्डर का नाम"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    📁 आपके फोन में इस नाम से डेटा सुरक्षित रहेगा।
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      दुकानदार का नाम *
                    </label>
                    <div className="relative">
                      <FiUser className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="आपका नाम"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मोबाइल नंबर *
                    </label>
                    <div className="relative">
                      <FiPhone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="10 अंक"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UPI ID */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FiSmartphone className="w-4 h-4 text-emerald-600" />
                    दुकान की UPI ID (QR कोड पेमेंट हेतु)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. 9876543210@paytm या shop@axl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ⚡ यह डालते ही बिलों पर ऑटो-अमाउंट QR कोड सक्रिय हो जाएगा।
                  </p>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पसंदीदा रंग (App Theme)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'royal-blue', label: 'रॉयल ब्लू', bg: 'bg-blue-600' },
                      { key: 'emerald-green', label: 'हरा', bg: 'bg-emerald-600' },
                      { key: 'orange-gold', label: 'केसरिया', bg: 'bg-orange-600' },
                      { key: 'royal-purple', label: 'बैंगनी', bg: 'bg-purple-600' },
                    ].map((th) => (
                      <button
                        key={th.key}
                        type="button"
                        onClick={() => setTheme(th.key)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          theme === th.key
                            ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${th.bg}`} />
                        <span>{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <FiCheck className="w-4 h-4" />
                    {loading ? 'सहेजा जा रहा है...' : 'खाता बुक शुरू करें'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
