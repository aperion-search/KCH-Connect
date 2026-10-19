import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Attendance() {
  const { students, currentUser, showToast } = useApp();
  const [attendanceView, setAttendanceView] = useState('daily');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  // Monthly view state
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('/api/attendance');
      setAttendanceData(res.data || {});
    } catch (e) {
      console.error('Error fetching attendance:', e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const markAttendance = async (targetDate, studentId, status) => {
    try {
      const updatedRecords = {
        ...(attendanceData[targetDate] || {}),
        [studentId]: status
      };

      await axios.post('/api/attendance', {
        date: targetDate,
        records: updatedRecords
      });

      setAttendanceData(prev => ({
        ...prev,
        [targetDate]: updatedRecords
      }));
      showToast(`Attendance marked as ${status}`);
    } catch (e) {
      console.error('Error saving attendance:', e);
      showToast('Failed to save attendance.', 'error');
    }
  };

  const gradesList = ['All', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'ATFAAL'];

  // Filter students based on role and selected grade
  const filteredStudents = students.filter(s => {
    if (currentUser?.role === 'parent') {
      return String(s.rollId) === String(currentUser.studentId) || String(s.id) === String(currentUser.studentId);
    }
    if (selectedGrade !== 'All' && String(s.grade).trim() !== String(selectedGrade)) {
      return false;
    }
    return true;
  });

  const currentDateAttendance = attendanceData[date] || {};

  // Check if all filtered students are currently marked 'Present'
  const allArePresent = filteredStudents.length > 0 && filteredStudents.every(s => currentDateAttendance[s.id] === 'Present' || currentDateAttendance[s.rollId] === 'Present');

  const handleMarkAllToggle = async () => {
    const targetStatus = allArePresent ? 'N/A' : 'Present';
    const updatedRecords = { ...(attendanceData[date] || {}) };
    filteredStudents.forEach(s => {
      updatedRecords[s.id] = targetStatus;
      if (s.rollId) updatedRecords[s.rollId] = targetStatus;
    });

    try {
      await axios.post('/api/attendance', {
        date,
        records: updatedRecords
      });
      setAttendanceData(prev => ({
        ...prev,
        [date]: updatedRecords
      }));
      showToast(`All filtered students marked as ${targetStatus}`);
    } catch (e) {
      showToast('Failed to mark all attendance.', 'error');
    }
  };

  const handleExportExcel = () => {
    // Generate CSV for monthly attendance
    const [year, month] = yearMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();

    let csv = 'Roll ID,Student Name,Arabic Name,Grade,' + Array.from({length: daysInMonth}, (_, i) => i + 1).join(',') + '\n';

    filteredStudents.forEach(s => {
      let row = `"${s.rollId || s.id}","${s.name}","${s.arabicName || ''}","${s.grade || ''}"`;
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dKey = `${year}-${month}-${dayStr}`;
        const status = (attendanceData[dKey] && (attendanceData[dKey][s.id] || attendanceData[dKey][s.rollId])) || '-';
        row += `,${status}`;
      }
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${yearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance exported successfully!');
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Track and manage daily & monthly student attendance</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setAttendanceView('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              attendanceView === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setAttendanceView('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              attendanceView === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly Grid
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {attendanceView === 'daily' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {attendanceView === 'monthly' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <input
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {currentUser?.role !== 'parent' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Class:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500"
                >
                  {gradesList.map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentUser?.role !== 'parent' && attendanceView === 'daily' && (
              <button
                onClick={handleMarkAllToggle}
                className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-check-double text-green-600"></i>
                {allArePresent ? 'Mark All N/A' : 'Mark All Present'}
              </button>
            )}

            {attendanceView === 'monthly' && (
              <button
                onClick={handleExportExcel}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-file-excel"></i> Export Excel
              </button>
            )}
          </div>
        </div>

        {attendanceView === 'daily' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50">
                  <th className="px-4 sm:px-6 py-4 font-medium">Student Name & Quick Attendance</th>
                  <th className="px-4 sm:px-6 py-4 font-medium hidden sm:table-cell w-28">Class</th>
                  <th className="px-4 sm:px-6 py-4 font-medium text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const currentStatus = currentDateAttendance[student.id] || currentDateAttendance[student.rollId] || 'Present';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {student.photo ? (
                              <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-madrasa-gold/40 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-base flex-shrink-0 border border-madrasa-gold/20">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-base">{student.name}</p>
                              <p className="text-base sm:text-lg font-bold text-gray-700" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{student.arabicName || '-'}</p>
                              <p className="text-xs text-gray-400">Roll ID: {student.rollId || student.id}</p>
                            </div>
                          </div>

                          {/* Quick Attendance Icon Buttons */}
                          {currentUser?.role !== 'parent' && (
                            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                              <button
                                onClick={() => markAttendance(date, student.id, 'Present')}
                                title="Present"
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentStatus === 'Present' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-green-700 hover:bg-green-50 border border-green-200'}`}
                              >
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button
                                onClick={() => markAttendance(date, student.id, 'Absent')}
                                title="Absent"
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentStatus === 'Absent' ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'}`}
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                              <button
                                onClick={() => markAttendance(date, student.id, 'Leave')}
                                title="Leave"
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentStatus === 'Leave' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'}`}
                              >
                                <i className="fa-solid fa-plane-departure"></i>
                              </button>
                              <button
                                onClick={() => markAttendance(date, student.id, 'N/A')}
                                title="N/A"
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentStatus === 'N/A' ? 'bg-gray-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
                              >
                                <i className="fa-solid fa-minus"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell align-middle">
                        <span className="px-3 py-1 bg-madrasa-gold/10 text-gray-800 text-xs rounded-full font-bold">
                          Class {student.grade}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-block shadow-sm ${
                            currentStatus === 'Present' ? 'bg-green-50 text-green-700 border border-green-200' :
                            currentStatus === 'Absent' ? 'bg-red-50 text-red-700 border border-red-200' :
                            currentStatus === 'Leave' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {currentStatus}
                          </span>
                          {currentStatus === 'Absent' && student.phone && student.phone !== '-' && currentUser?.role !== 'parent' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <a
                                href={`tel:${student.phone}`}
                                className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1 shadow-sm"
                                title="Call Parent"
                              >
                                <i className="fa-solid fa-phone"></i> Call
                              </a>
                              <a
                                href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`📋 ABSENTEE NOTICE\n\nDear Parents,\n\nYour ward, ${student.name} (${student.grade || 'Class'}), was marked absent on ${date} without prior intimation.\n\nKindly submit a leave request here: https://kch-connect.onrender.com/\n\nKindly ensure your child attends school tomorrow with all pending work completed.\n\nRegards,\nMadrasa Wajihiyah Khachroad (Sender: +91 7737252833)`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                                title="Send WhatsApp Message"
                              >
                                <i className="fa-brands fa-whatsapp"></i> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Monthly Attendance Grid ({yearMonth})</h3>
            <table className="w-auto text-center border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-2 border border-gray-200 sticky left-0 bg-gray-50 z-10">Student</th>
                  {Array.from({length: new Date(yearMonth.split('-')[0], yearMonth.split('-')[1], 0).getDate()}, (_, i) => (
                    <th key={i+1} className="p-2 border border-gray-200 w-8">{i+1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const [year, month] = yearMonth.split('-');
                  const daysInMonth = new Date(year, month, 0).getDate();
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-200 text-left font-medium sticky left-0 bg-white z-10 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-madrasa-gold/10 text-madrasa-gold font-bold text-xs flex items-center justify-center">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <span>{student.name}</span>
                        </div>
                      </td>
                      {Array.from({length: daysInMonth}, (_, i) => {
                        const day = i + 1;
                        const dayStr = String(day).padStart(2, '0');
                        const dKey = `${year}-${month}-${dayStr}`;
                        const status = (attendanceData[dKey] && (attendanceData[dKey][student.id] || attendanceData[dKey][student.rollId])) || '-';
                        let badgeColor = 'text-gray-400';
                        if (status === 'Present') badgeColor = 'bg-green-100 text-green-800 font-bold';
                        else if (status === 'Absent') badgeColor = 'bg-red-100 text-red-800 font-bold';
                        else if (status === 'Leave') badgeColor = 'bg-blue-100 text-blue-800 font-bold';
                        else if (status === 'N/A') badgeColor = 'bg-gray-100 text-gray-600';

                        return (
                          <td key={day} className={`p-1 border border-gray-200 ${badgeColor}`}>
                            {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Leave' ? 'L' : status === 'N/A' ? '-' : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
