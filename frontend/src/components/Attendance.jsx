import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Attendance() {
  const { currentDate, students, attendance, markAttendance, markAllPresent, showToast, currentUser, getVisibleStudents } = useApp();
  const [date, setDate] = useState(currentDate);
  const [classFilter, setClassFilter] = useState('all');
  const [attendanceView, setAttendanceView] = useState('daily'); // 'daily' or 'monthly'

  // Get visible students based on filter and user role
  const baseStudents = useMemo(() => getVisibleStudents(), [currentUser, students, getVisibleStudents]);

  // Filter students based on class and search
  const filteredStudents = useMemo(() => {
    let filtered = baseStudents;

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter(s => s.grade === classFilter.toString());
    }

    return filtered;
  }, [baseStudents, classFilter]);

  // Get or initialize attendance records for selected date
  const currentDateAttendance = attendance[date] || {};

  const todayRecord = filteredStudents.map(student => {
    const studentStatus = currentDateAttendance[student.id];
    return {
      ...student,
      status: studentStatus || 'Present' // Default to Present when no attendance marked
    };
  });

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const canMarkAll = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const handleMarkAllPresent = () => {
    if (!canMarkAll) {
      showToast('Only admins and teachers can mark all.', 'error');
      return;
    }
    const updates = {};
    filteredStudents.forEach(s => {
      updates[s.id] = 'Present';
    });
    markAllPresent(date, updates);
  };

  // Populate class dropdown
  const classes = ['all', ...new Set(baseStudents.map(s => s.grade || '').filter(Boolean))].sort();

  // Monthly grid helper
  const yearMonth = date.substring(0, 7); // YYYY-MM
  const daysInMonth = useMemo(() => {
    const [y, m] = yearMonth.split('-').map(Number);
    const count = new Date(y, m, 0).getDate();
    const days = [];
    for (let i = 1; i <= count; i++) {
      const dayStr = String(i).padStart(2, '0');
      days.push(`${yearMonth}-${dayStr}`);
    }
    return days;
  }, [yearMonth]);

  const markedCount = todayRecord.filter(s => currentDateAttendance[s.id]).length;

  const handleExportExcel = () => {
    const escapeHtml = (str) => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #000000; text-align: center; padding: 8px; mso-number-format:"\@"; }
          td { border: 1px solid #d1d5db; text-align: center; padding: 6px; mso-number-format:"\@"; }
          .student-name { text-align: left; font-weight: bold; mso-number-format:"\@"; }
          .class-col { text-align: center; mso-number-format:"\@"; }
        </style>
      </head>
      <body>
        <h2>Attendance Report - ${yearMonth}</h2>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
    `;

    daysInMonth.forEach(d => {
      const parts = d.split('-');
      const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY format
      html += `<th>${dateStr}</th>`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    filteredStudents.forEach(student => {
      html += `
        <tr>
          <td class="student-name">${escapeHtml(student.name)}</td>
          <td class="class-col">${escapeHtml(student.grade || '-')}</td>
      `;

      daysInMonth.forEach(d => {
        const dayAtt = attendance[d]?.[student.id] || '-';
        const displayVal = dayAtt === 'Present' ? 'P' : dayAtt === 'Absent' ? 'A' : dayAtt === 'Leave' ? 'L' : '-';
        html += `<td>${displayVal}</td>`;
      });

      html += `</tr>`;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_grid_${yearMonth}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Monthly attendance Excel report exported successfully!');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Mark daily records & view history</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
          <button
            onClick={handlePrevDay}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded transition-colors"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-none bg-transparent px-3 py-1 text-gray-700 font-medium outline-none w-36 cursor-pointer"
          />
          <button
            onClick={handleNextDay}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded transition-colors"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setAttendanceView('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${attendanceView === 'daily' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Daily List
              </button>
              <button
                onClick={() => setAttendanceView('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${attendanceView === 'monthly' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly Grid
              </button>
            </div>
            <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-200 hidden sm:block">
              {markedCount}/{filteredStudents.length} Marked
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm flex-1 sm:flex-none cursor-pointer font-medium text-gray-700"
            >
              <option value="all">All Classes</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {canMarkAll && attendanceView === 'daily' && (
              <button
                onClick={handleMarkAllPresent}
                className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm font-bold flex-1 sm:flex-none whitespace-nowrap transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-check-double text-green-600 mr-2"></i> Mark All Present
              </button>
            )}

            {attendanceView === 'monthly' && (
              <button
                onClick={handleExportExcel}
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer flex-1 sm:flex-none justify-center"
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
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-white">
                  <th className="px-4 sm:px-6 py-4 font-medium">Student</th>
                  <th className="px-4 sm:px-6 py-4 font-medium hidden sm:table-cell">Class</th>
                  <th className="px-4 sm:px-6 py-4 font-medium text-center w-36">Status</th>
                  {currentUser?.role !== 'parent' && (
                    <th className="px-4 sm:px-6 py-4 font-medium text-center w-36">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayRecord.map((student) => {
                  const statusOptions = ['Present', 'Absent', 'Leave'];
                  const currentStatus = currentDateAttendance[student.id] || 'Present';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-sm flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-700" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{student.arabicName || '-'}</p>
                            <p className="text-xs text-gray-500 truncate sm:hidden">Class {student.grade}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.phone && student.phone !== '-' && (
                              <>
                                <a
                                  href={`tel:${student.phone.replace(/[^0-9]/g, '')}`}
                                  className="flex items-center text-blue-600 hover:text-blue-700 p-1"
                                  title={`Call ${student.name} (${student.phone})`}
                                >
                                  <i className="fa-solid fa-phone text-base"></i>
                                </a>
                                <a
                                  href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-green-600 hover:text-green-700 p-1"
                                  title={`WhatsApp ${student.name}`}
                                >
                                  <i className="fa-brands fa-whatsapp text-lg"></i>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="px-2.5 py-1 bg-madrasa-gold/10 text-gray-800 text-xs rounded-full font-medium">
                          Class {student.grade}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        {currentUser?.role !== 'parent' ? (
                          <select
                            value={currentStatus}
                            onChange={(e) => {
                              markAttendance(date, student.id, e.target.value);
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-colors font-medium"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            student.status === 'Present' ? 'bg-green-50 text-green-600' :
                            student.status === 'Absent' ? 'bg-red-50 text-red-600' :
                            student.status === 'Leave' ? 'bg-blue-50 text-blue-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            {student.status}
                          </span>
                        )}
                      </td>
                      {currentUser?.role !== 'parent' && (
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => markAttendance(date, student.id, 'Present')}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${currentStatus === 'Present' ? 'bg-green-100 text-green-700 font-bold' : 'text-green-600 hover:bg-green-50'}`}
                              title="Mark Present"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button
                              onClick={() => markAttendance(date, student.id, 'Absent')}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${currentStatus === 'Absent' ? 'bg-red-100 text-red-700 font-bold' : 'text-red-600 hover:bg-red-50'}`}
                              title="Mark Absent"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                            <button
                              onClick={() => markAttendance(date, student.id, 'Leave')}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${currentStatus === 'Leave' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-blue-600 hover:bg-blue-50'}`}
                              title="Mark Leave"
                            >
                              <i className="fa-solid fa-plane-departure"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Monthly Attendance Grid ({yearMonth})</h3>
            <table className="w-auto text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-2 text-left sticky left-0 bg-gray-50 z-10 border-r">Student</th>
                  {daysInMonth.map(d => {
                    const dayNum = d.split('-')[2];
                    return <th key={d} className="p-1.5 border-r font-medium text-gray-600">{dayNum}</th>;
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-2 text-left font-medium text-gray-900 sticky left-0 bg-white border-r truncate max-w-[150px]">
                      {student.name}
                    </td>
                    {daysInMonth.map(d => {
                      const dayAtt = attendance[d]?.[student.id] || '-';
                      const badgeColor =
                        dayAtt === 'Present' ? 'bg-green-100 text-green-700' :
                        dayAtt === 'Absent' ? 'bg-red-100 text-red-700' :
                        dayAtt === 'Leave' ? 'bg-blue-100 text-blue-700' :
                        'text-gray-300';
                      const shortCode = dayAtt === 'Present' ? 'P' : dayAtt === 'Absent' ? 'A' : dayAtt === 'Leave' ? 'L' : '-';
                      return (
                        <td key={d} className="p-1 border-r">
                          <span className={`inline-block w-6 h-6 leading-6 rounded font-bold ${badgeColor}`} title={`${d}: ${dayAtt}`}>
                            {shortCode}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No students found</p>
            <p className="text-sm">Try changing the class filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
