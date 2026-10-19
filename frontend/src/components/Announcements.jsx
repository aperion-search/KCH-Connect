import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Announcements() {
  const { currentUser, showToast } = useApp();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/api/announcements');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Title and message are required.', 'error');
      return;
    }

    try {
      let mediaUrl = null;
      let mediaType = 'file';

      if (uploadFile) {
        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(uploadFile);
        });

        const uploadRes = await axios.post('/api/upload', {
          image: base64Data,
          filename: uploadFile.name
        });
        mediaUrl = uploadRes.data.url;

        const ext = uploadFile.name.split('.').pop().toLowerCase();
        if (uploadFile.type.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
          mediaType = 'photo';
        } else if (uploadFile.type.startsWith('video') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
          mediaType = 'video';
        } else if (uploadFile.type.startsWith('audio') || ['mp3', 'wav', 'aac'].includes(ext)) {
          mediaType = 'audio';
        } else if (['pdf'].includes(ext)) {
          mediaType = 'pdf';
        } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
          mediaType = 'document';
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
          mediaType = 'spreadsheet';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
          mediaType = 'archive';
        }
      }

      const res = await axios.post('/api/announcements', {
        title,
        message,
        author: currentUser?.name || 'Admin',
        date: new Date().toISOString().split('T')[0],
        mediaUrl,
        mediaType
      });

      setAnnouncements(prev => [res.data.announcement, ...prev]);
      setTitle('');
      setMessage('');
      setUploadFile(null);
      showToast('Announcement posted successfully!');
    } catch (e) {
      console.error('Post error:', e);
      showToast('Failed to post announcement.', 'error');
    }
  };

  const handleDelete = async (id, item) => {
    try {
      if (item?.mediaUrl) {
        const filename = item.mediaUrl.split('/').pop();
        await axios.delete(`/api/upload/${filename}`).catch(() => {});
      }
      await axios.delete(`/api/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => String(a.id) !== String(id)));
      showToast('Announcement deleted.');
    } catch (e) {
      showToast('Failed to delete announcement.', 'error');
    }
  };

  const renderFileThumbnail = (item) => {
    const ext = (item.mediaUrl || '').split('.').pop().toLowerCase();
    const fileName = item.mediaUrl ? item.mediaUrl.split('/').pop() : 'Attachment';

    if (item.mediaType === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return (
        <div className="cursor-pointer" onClick={() => setPreviewItem(item)}>
          <img src={item.mediaUrl} alt={item.title} className="w-full max-h-96 object-contain bg-gray-900 hover:opacity-95 transition" />
        </div>
      );
    }
    if (item.mediaType === 'video' || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return <video src={item.mediaUrl} controls className="w-full max-h-96 object-contain bg-black" />;
    }
    if (item.mediaType === 'audio' || ['mp3', 'wav', 'aac'].includes(ext)) {
      return (
        <div className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 p-6 flex flex-col items-center justify-center text-white">
          <i className="fa-solid fa-music text-3xl mb-2 animate-pulse"></i>
          <p className="text-xs font-semibold mb-2">{fileName}</p>
          <audio src={item.mediaUrl} controls className="w-full max-w-md" />
        </div>
      );
    }
    if (item.mediaType === 'pdf' || ['pdf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full bg-red-50 p-6 flex items-center justify-between text-red-600 border-t border-red-100 cursor-pointer hover:bg-red-100/60 transition">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-pdf text-4xl"></i>
            <div>
              <p className="font-bold text-sm text-red-800">PDF Document Attachment</p>
              <p className="text-xs text-red-600">{fileName} — Click to Preview</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-lg">Preview PDF</span>
        </div>
      );
    }
    if (item.mediaType === 'document' || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full bg-blue-50 p-6 flex items-center justify-between text-blue-600 border-t border-blue-100 cursor-pointer hover:bg-blue-100/60 transition">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-lines text-4xl"></i>
            <div>
              <p className="font-bold text-sm text-blue-800">Document Attachment</p>
              <p className="text-xs text-blue-600">{fileName} — Click to View</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded-lg">View Document</span>
        </div>
      );
    }
    if (item.mediaType === 'spreadsheet' || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full bg-emerald-50 p-6 flex items-center justify-between text-emerald-600 border-t border-emerald-100 cursor-pointer hover:bg-emerald-100/60 transition">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-excel text-4xl"></i>
            <div>
              <p className="font-bold text-sm text-emerald-800">Spreadsheet Attachment</p>
              <p className="text-xs text-emerald-600">{fileName} — Click to View</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">View Spreadsheet</span>
        </div>
      );
    }
    return (
      <div onClick={() => setPreviewItem(item)} className="w-full bg-gray-50 p-6 flex items-center justify-between text-gray-700 border-t border-gray-200 cursor-pointer hover:bg-gray-100 transition">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-file-arrow-down text-4xl text-primary-600"></i>
          <div>
            <p className="font-bold text-sm text-gray-800">File Attachment</p>
            <p className="text-xs text-gray-500">{fileName} — Click to View</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg">View</span>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Announcements & Notices</h1>
          <p className="text-gray-500 mt-1 text-sm">Madrasa notices, updates, and universal file attachments</p>
        </div>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4 text-base">Post New Announcement</h2>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notice title..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write announcement details here..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Any format: PDF, Word, Excel, Images, ZIP, etc.)</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors cursor-pointer"
            >
              Post Announcement
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading announcements...</div>
        ) : announcements.length > 0 ? (
          announcements.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">By {item.author || 'Admin'} • {item.date}</p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(item.id, item)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mt-3 text-sm leading-relaxed">{item.message}</p>
              </div>

              {item.mediaUrl && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {renderFileThumbnail(item)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <i className="fa-solid fa-bullhorn text-4xl text-gray-300 mb-3"></i>
            <p className="text-base font-medium">No announcements yet</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 truncate">{previewItem.title}</h3>
              <button onClick={() => setPreviewItem(null)} className="text-gray-500 hover:text-gray-800 p-2 text-lg"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-900 min-h-[350px]">
              {previewItem.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || previewItem.mediaType === 'photo' ? (
                <img src={previewItem.mediaUrl} alt={previewItem.title} className="max-h-[70vh] object-contain rounded-lg" />
              ) : previewItem.mediaUrl?.match(/\.pdf$/i) || previewItem.mediaType === 'pdf' ? (
                <iframe src={previewItem.mediaUrl} title={previewItem.title} className="w-full h-[65vh] rounded-lg bg-white" />
              ) : (
                <div className="text-center text-white py-12">
                  <i className="fa-solid fa-file-arrow-down text-6xl text-primary-400 mb-4"></i>
                  <p className="text-lg font-medium mb-4">Attachment file ready</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 gap-3">
              <button onClick={() => setPreviewItem(null)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
