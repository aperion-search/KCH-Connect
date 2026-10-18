import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function About() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState('about');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About</h1>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setTab('about')} className={`px-4 py-2 rounded-lg font-medium ${tab === 'about' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>About School</button>
        <button onClick={() => setTab('team')} className={`px-4 py-2 rounded-lg font-medium ${tab === 'team' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>Team</button>
      </div>

      {tab === 'about' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Madrasa Wajihiyah Khachroad</h2>
          <p className="text-gray-600 leading-relaxed">A place of learning, spirituality, and community. Our mission is to provide quality education rooted in values.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center"><h4 className="font-bold text-xl text-primary-600">200+</h4><p className="text-xs text-gray-500">Students</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><h4 className="font-bold text-xl text-primary-600">12</h4><p className="text-xs text-gray-500">Teachers</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><h4 className="font-bold text-xl text-primary-600">5</h4><p className="text-xs text-gray-500">Grades</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><h4 className="font-bold text-xl text-primary-600">15+</h4><p className="text-xs text-gray-500">Years</p></div>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {['Head Teacher', 'Admin', 'Class Teacher'].map(role => (
            <div key={role} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg">{role}</h3>
              <p className="text-gray-500 text-sm">Contact via admin panel for full details.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
