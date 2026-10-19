import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [syncStatus, setSyncStatus] = useState('Checking Data...');

  const currentDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchData = async () => {
    try {
      setSyncStatus('Syncing...');
      const [studRes, teachRes, attRes, leaveRes, galRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/teachers'),
        axios.get('/api/attendance'),
        axios.get('/api/leaves'),
        axios.get('/api/gallery')
      ]);

      setStudents(studRes.data || []);
      setTeachers(teachRes.data || []);
      setAttendance(attRes.data || {});
      setLeaves(leaveRes.data || []);
      setGallery(galRes.data || []);
      setSyncStatus('Synced');
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setSyncStatus('Offline / Sync Error');
      showToast('Failed to load records from backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (id, pass, remember = false) => {
    const cleanId = id.trim();
    const cleanPass = pass.trim();

    // 1. Admin
    if (cleanId === 'admin' && cleanPass === 'admin') {
      const user = { role: 'admin', name: 'Super Admin', id: 'admin' };
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('saved_login_id', cleanId);
        localStorage.setItem('saved_login_pass', cleanPass);
      }
      showToast('Welcome, Administrator!');
      fetchData();
      return true;
    }

    // 2. Teacher
    const teacher = teachers.find(t => t.id === cleanId);
    if (teacher && cleanPass === 'School5253') {
      const user = { role: 'teacher', name: teacher.name, id: teacher.id };
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('saved_login_id', cleanId);
        localStorage.setItem('saved_login_pass', cleanPass);
      }
      showToast(`Welcome, ${teacher.name}!`);
      fetchData();
      return true;
    }

    // 3. Parent / Student
    const student = students.find(s => s.rollId === cleanId || String(s.id) === cleanId);
    const expectedPass = student?.password || '515253';
    if (student && cleanPass === expectedPass) {
      const user = { role: 'parent', name: student.name, studentId: student.rollId || student.id, details: student };
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('saved_login_id', cleanId);
        localStorage.setItem('saved_login_pass', cleanPass);
      }
      showToast(`Welcome, ${student.name}'s Guardian!`);
      fetchData();
      return true;
    }

    showToast('Invalid credentials. Please try again.', 'error');
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('saved_login_id');
    localStorage.removeItem('saved_login_pass');
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  useEffect(() => {
    fetchData();
    // Auto-login if remembered
    const savedId = localStorage.getItem('saved_login_id');
    const savedPass = localStorage.getItem('saved_login_pass');
    if (savedId && savedPass) {
      handleLogin(savedId, savedPass, true);
    }
  }, []);

  // Mark single attendance
  const markAttendance = async (date, studentId, status) => {
    try {
      const updatedDateAttendance = { ...(attendance[date] || {}), [studentId]: status };
      const newAttendance = { ...attendance, [date]: updatedDateAttendance };
      setAttendance(newAttendance);

      await axios.post('/api/attendance', {
        date,
        records: { [studentId]: status }
      });
      showToast(`Marked ${status}`);
    } catch (e) {
      showToast('Error saving attendance', 'error');
    }
  };

  // Mark all present
  const markAllPresent = async (date, updates) => {
    try {
      const updatedDateAttendance = { ...(attendance[date] || {}), ...updates };
      setAttendance({ ...attendance, [date]: updatedDateAttendance });

      await axios.post('/api/attendance', {
        date,
        records: updates
      });
      showToast('All students marked Present');
    } catch (e) {
      showToast('Error saving attendance', 'error');
    }
  };

  // Submit Leave
  const submitLeave = async (leaveData) => {
    try {
      const res = await axios.post('/api/leaves', leaveData);
      setLeaves(prev => [...prev, res.data.leave]);
      showToast('Leave submitted successfully!');
    } catch (e) {
      showToast('Failed to submit leave', 'error');
    }
  };

  // Sorting helper for students by class (9,8,7,6,5,4,3,2,1,atfaal) and gender (Male then Female)
  const gradeOrder = { '9': 1, '8': 2, '7': 3, '6': 4, '5': 5, '4': 6, '3': 7, '2': 8, '1': 9, 'ATFAAL': 10 };
  const sortStudents = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
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
  };

  const updateLeaveStatus = async (id, status, rejReason = '') => {
    try {
      const res = await axios.put(`/api/leaves/${id}`, { status, rejReason });
      setLeaves(prev => prev.map(l => l.id === id ? res.data.leave : l));
      await fetchData();
      showToast(`Leave status updated to ${status}`);
    } catch (e) {
      showToast('Failed to update leave status', 'error');
    }
  };

  const deleteLeave = async (id) => {
    try {
      await axios.delete(`/api/leaves/${id}`);
      setLeaves(prev => prev.filter(l => l.id !== id));
      showToast('Leave request deleted!');
    } catch (e) {
      showToast('Failed to delete leave', 'error');
    }
  };

  // CRUD for Students
  const addStudent = async (student) => {
    try {
      const res = await axios.post('/api/students', student);
      setStudents(prev => [...prev, res.data.student]);
      showToast('Student added successfully!');
    } catch (e) {
      showToast('Failed to add student', 'error');
    }
  };

  const updateStudent = async (id, updated) => {
    try {
      const res = await axios.put(`/api/students/${id}`, updated);
      setStudents(prev => prev.map(s => (String(s.id) === String(id) || String(s.rollId) === String(id)) ? res.data.student : s));
      showToast('Student updated!');
    } catch (e) {
      showToast('Failed to update student', 'error');
    }
  };

  const deleteStudent = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      setStudents(prev => prev.filter(s => String(s.id) !== String(id) && String(s.rollId) !== String(id)));
      showToast('Student removed!');
    } catch (e) {
      showToast('Failed to remove student', 'error');
    }
  };

  // CRUD for Teachers
  const addTeacher = async (teacher) => {
    try {
      const res = await axios.post('/api/teachers', teacher);
      setTeachers(prev => [...prev, res.data.teacher]);
      showToast('Teacher added!');
    } catch (e) {
      showToast('Failed to add teacher', 'error');
    }
  };

  const updateTeacher = async (id, updated) => {
    try {
      const res = await axios.put(`/api/teachers/${id}`, updated);
      setTeachers(prev => prev.map(t => String(t.id) === String(id) ? res.data.teacher : t));
      showToast('Teacher updated!');
    } catch (e) {
      showToast('Failed to update teacher', 'error');
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await axios.delete(`/api/teachers/${id}`);
      setTeachers(prev => prev.filter(t => String(t.id) !== String(id)));
      showToast('Teacher removed!');
    } catch (e) {
      showToast('Failed to remove teacher', 'error');
    }
  };

  const saveGallery = async (updatedFolders) => {
    try {
      setGallery(updatedFolders);
      await axios.post('/api/gallery', { folders: updatedFolders });
    } catch (e) {
      showToast('Error saving gallery', 'error');
    }
  };

  // Compute visible students based on role
  const getVisibleStudents = () => {
    if (!currentUser) return [];
    let list = [];
    if (currentUser.role === 'admin') list = students;
    else if (currentUser.role === 'teacher') {
      const teacher = teachers.find(t => t.id === currentUser.id);
      if (teacher) {
        const classes = teacher.assignedClasses || (teacher.assignedClass ? [teacher.assignedClass] : []);
        if (classes.length > 0) {
          list = students.filter(s => classes.includes(s.grade));
        } else {
          list = students.filter(s => s.grade === currentUser.id || s.id === currentUser.id); // safe fallback
        }
      } else {
        list = students.filter(s => s.grade === currentUser.id || s.id === currentUser.id); // safe fallback
      }
    } else if (currentUser.role === 'parent') {
      list = students.filter(s => s.rollId === currentUser.studentId);
    }
    return sortStudents(list);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      activeTab,
      setActiveTab,
      students,
      teachers,
      attendance,
      leaves,
      gallery,
      loading,
      syncStatus,
      currentDate,
      toasts,
      showToast,
      handleLogin,
      handleLogout,
      markAttendance,
      markAllPresent,
      submitLeave,
      updateLeaveStatus,
      deleteLeave,
      saveGallery,
      addStudent,
      updateStudent,
      deleteStudent,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      getVisibleStudents
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
