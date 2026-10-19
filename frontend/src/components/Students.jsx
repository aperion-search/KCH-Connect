import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Students() {
  const { currentUser, students, teachers, showToast } = useApp();
  const [classFilter, setClassFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get visible students based on user role
  const baseStudents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return students;
    if (currentUser.role === 'teacher') {
      const teacher = teachers.find(t => t.id === currentUser.id);
      if (!teacher || !teacher.assignedClass) return students; // fallback
      return students.filter(s => s.grade === teacher.assignedClass);
    }
    if (currentUser.role === 'parent') {
      return students.filter(s => s.rollId === currentUser.studentId);
    }
    return [];
  }, [currentUser, students, teachers]);

  // Sort students by grade
  const gradeOrder = { '9': 1, '8': 2, '7': 3, '6': 4, '5': 5, '4': 6, '3': 7, '2': 8, '1': 9, 'ATFAAL': 10 };
  const sortedStudents = useMemo(() => {
    return [...baseStudents].sort((a, b) => {
      const gA = gradeOrder[String(a.grade || '').trim().toUpperCase()] || 99;
      const gB = gradeOrder[String(b.grade || '').trim().toUpperCase()] || 99;
      if (gA !== gB) return gA - gB;

      const isMale = (g) => {
        const s = String(g || '').trim().toUpperCase();
        return s === 'M' || s === 'MALE';
      };
      const maleA = isMale(a.gender) ? 0 : 1;
      const maleB = isMale(b.gender) ? 0 : 1;
      if (maleA !== maleB) return maleA - maleB;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [baseStudents]);

  // Filter students based on class, search, and user role
  const filteredStudents = useMemo(() => {
    let filtered = sortedStudents;

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter(s => s.grade === classFilter.toString());
    }

    // Filter by search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.rollId.toLowerCase().includes(searchLower) ||
        s.phone?.includes(searchTerm.replace(/[^0-9]/g, ''))
      );
    }

    return filtered;
  }, [sortedStudents, classFilter, searchTerm]);

  const classes = ['all', ...new Set(baseStudents.map(s => s.grade || '').filter(Boolean))].sort();

  const sendBulkEmail = async () => {
    showToast('Bulk email functionality will be implemented');
  };

  const renderTableView = () => (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-white">
          <th className="px-4 sm:px-6 py-4 font-medium">Name & Contact</th>
          <th className="px-4 sm:px-6 py-4 font-medium hidden sm:table-cell">Class</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {filteredStudents.map((student, index) => (
          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-sm flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{student.name}</p>
                  <p className="text-sm sm:text-base font-bold text-gray-700" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{student.arabicName || '-'}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Roll: {student.rollId}</span>
                    {student.phone && student.phone !== '-' && (
                      <span className="text-gray-500">{student.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
              <span className="px-2.5 py-1 bg-madrasa-gold/10 text-gray-800 text-xs rounded-full font-medium">
                Class {student.grade}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Directory</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-3">
          <h2 className="font-semibold text-gray-800 whitespace-nowrap">
            Directory (<span id="directory-count">{filteredStudents.length}</span>)
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={sendBulkEmail}
              className="text-sm bg-primary-50 text-primary-600 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100 font-bold w-full sm:w-auto whitespace-nowrap transition-all cursor-pointer"
            >
              <i className="fa-solid fa-envelopes-bulk mr-2"></i> Email Class
            </button>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white w-full sm:w-auto cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-auto">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            renderTableView()
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No students found</p>
              <p className="text-sm">Try changing the class filter or search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
