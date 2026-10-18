import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Leaves() {
  const {
    currentUser,
    currentDate,
    leaves,
    showToast,
    getVisibleStudents,
    students,
    submitLeave,
    updateLeaveStatus,
    deleteLeave
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [newLeave, setNewLeave] = useState({
    sId: '',
    type: '',
    reason: '',
    start: '',
    end: '',
    status: 'Pending'
  });

  const visibleStudents = getVisibleStudents();
  const userRole = currentUser?.role;

  useEffect(() => {
    if (userRole === 'parent' && visibleStudents.length === 1) {
      setNewLeave(prev => ({ ...prev, sId: visibleStudents[0].id }));
    }
  }, [userRole, visibleStudents]);

  const resetForm = () => {
    setNewLeave({
      sId: userRole === 'parent' && visibleStudents.length === 1 ? visibleStudents[0].id : '',
      type: '',
      reason: '',
      start: '',
      end: '',
      status: 'Pending'
    });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole === 'parent' && visibleStudents.length === 1 && newLeave.sId === visibleStudents[0].id) {
    } else if (!newLeave.sId) {
      showToast('Please select a student.', 'error');
      return;
    }

    if (!newLeave.start || !newLeave.end || !newLeave.type || !newLeave.reason) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (new Date(newLeave.start) > new Date(newLeave.end)) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    const leaveData = {
      ...newLeave,
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };

    await submitLeave(leaveData);
    resetForm();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      Approved: 'bg-green-50 text-green-800 border-green-200',
      Rejected: 'bg-red-50 text-red-800 border-red-200'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[status] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>{
        status
      }</span>
    );
  };

  const filteredLeaves = leaves.filter(leave => {
    if (userRole === 'parent') {
      return leave.sId === (visibleStudents[0]?.id) || leave.sId === (visibleStudents[0]?.rollId);
    }
    if (userRole === 'teacher') {
      return visibleStudents.some(s => String(s.id) === String(leave.sId) || String(s.rollId) === String(leave.sId));
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leave Applications</h1>
        </div>
      </div>

      {/* Parent Leave Form */}
      {userRole === 'parent' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Submit a Leave Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {visibleStudents.length === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-medium">
                  {visibleStudents[0].name}
                </div>
                <input type="hidden" name="sId" value={newLeave.sId} />
              </div>
            )}

            {userRole !== 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  required
                  value={newLeave.sId}
                  onChange={(e) => setNewLeave({...newLeave, sId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select Student...</option>
                  {visibleStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollId})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={newLeave.start}
                  onChange={(e) => setNewLeave({...newLeave, start: e.target.value})}
                  min={currentDate}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={newLeave.end}
                  onChange={(e) => setNewLeave({...newLeave, end: e.target.value})}
                  min={newLeave.start || currentDate}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Category</label>
              <select
                required
                value={newLeave.type}
                onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Select category...</option>
                <option value="Medical">Medical</option>
                <option value="Travelling">Travelling</option>
                <option value="Family Function">Family Function</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Reason</label>
              <textarea
                required
                rows="2"
                value={newLeave.reason}
                onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Please explain briefly..."
              />
            </div>

            <button
              type="submit"
              className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 w-full sm:w-auto transition-colors cursor-pointer"
            >
              Submit Application
            </button>
          </form>
        </div>
      )}

      {/* Leaves List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            Applications Status
          </h2>
          {userRole === 'parent' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-primary-50 text-primary-600 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer"
            >
              {showForm ? 'Cancel' : '+ New Application'}
            </button>
          )}
        </div>

        {filteredLeaves.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {filteredLeaves.map(leave => {
              const student = students.find(s => String(s.id) === String(leave.sId) || String(s.rollId) === String(leave.sId));
              return (
                <li key={leave.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-sm">
                          {student?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student?.name || 'Unknown Student'}</p>
                          <p className="text-sm text-gray-500">Roll: {student?.rollId || leave.sId} | {leave.type} | {leave.start} to {leave.end}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-13 sm:ml-0 mt-1 sm:mt-0">{leave.reason}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-sm text-gray-500">
                        Applied: {new Date(leave.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Status: {getStatusBadge(leave.status)}
                      </span>
                      {userRole === 'admin' && (
                        <div className="flex gap-2 items-center flex-wrap">
                          {leave.status !== 'Approved' && (
                            <button
                              onClick={() => updateLeaveStatus(leave.id, 'Approved')}
                              className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {leave.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                updateLeaveStatus(leave.id, 'Rejected', reason || '');
                              }}
                              className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this leave request?')) {
                                deleteLeave(leave.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-gray-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Leave"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No applications</h3>
            <p className="text-gray-500">No leave applications found</p>
          </div>
        )}
      </div>
    </div>
  );
}