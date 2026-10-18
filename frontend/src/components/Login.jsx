import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { handleLogin } = useApp();

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(loginId, password, remember);
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col justify-center items-center bg-arabic px-4">
      <div className="bg-[#0f172a]/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full border border-madrasa-gold/40 relative overflow-hidden">
        <div className="text-center mb-6 mt-4">
          <div className="flex justify-center items-center mb-4">
            <img
              src="/369669-removebg-preview.png"
              alt="Madrasa Logo"
              className="h-28 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden justify-center items-end gap-5 text-madrasa-gold mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <i className="fa-solid fa-book-open text-6xl"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-widest gold-gradient leading-tight">
            Madrasa Wajihiyah<br />Khachroad
          </h1>
          <p className="text-madrasa-gold/80 mt-2 text-sm font-medium">Please sign in to continue.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <i className="fa-solid fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-madrasa-gold/60"></i>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Login ID"
              className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/70 border border-madrasa-gold/30 text-white rounded-xl focus:ring-2 focus:ring-madrasa-gold outline-none transition-all placeholder-gray-500"
            />
          </div>
          <div className="relative">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-madrasa-gold/60"></i>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/70 border border-madrasa-gold/30 text-white rounded-xl focus:ring-2 focus:ring-madrasa-gold outline-none transition-all placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-between mt-2 mb-1 px-1">
            <label className="flex items-center text-madrasa-lightgold text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mr-2 rounded bg-[#1e293b] border-madrasa-gold/30 text-madrasa-gold focus:ring-madrasa-gold focus:ring-offset-0"
              />
              Remember me
            </label>
            <span className="text-[11px] bg-madrasa-gold/20 text-madrasa-lightgold px-2 py-1 rounded border border-madrasa-gold/30">
              Student Pass: <b>515253</b>
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-madrasa-gold to-yellow-600 text-[#061224] font-bold text-lg py-3.5 rounded-xl hover:opacity-90 shadow-[0_0_15px_rgba(212,175,55,0.4)] mt-2 transition-all cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-madrasa-gold/20 text-center">
          <p className="text-[10px] text-madrasa-gold/60 uppercase tracking-widest font-bold mb-2">Contact Us</p>
          <a href="mailto:kchmwajihiyah@gmail.com" className="inline-flex items-center text-sm font-medium text-madrasa-lightgold hover:text-white transition">
            <i className="fa-solid fa-envelope mr-2"></i> kchmwajihiyah@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
