import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Announcements() {
  const { currentUser, showToast } = useApp();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [previewItem]);

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
      const mediaItems = [];

      if (uploadFiles && uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          try {
            const reader = new FileReader();
            const base64Data = await new Promise((resolve, reject) => {
              reader.onload = (event) => resolve(event.target.result);
              reader.onerror = (error) => reject(error);
              reader.readAsDataURL(file);
            });

            const uploadRes = await axios.post('/api/upload', {
              image: base64Data,
              filename: file.name
            });
            const mediaUrl = uploadRes.data.url;

            const ext = file.name.split('.').pop().toLowerCase();
            let mediaType = 'file';
            if (file.type.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
              mediaType = 'photo';
            } else if (file.type.startsWith('video') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
              mediaType = 'video';
            } else if (file.type.startsWith('audio') || ['mp3', 'wav', 'aac'].includes(ext)) {
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

            mediaItems.push({
              url: mediaUrl,
              mediaType,
              title: file.name
            });
          } catch (err) {
            console.error('Failed to upload announcement file:', file.name, err);
          }
        }
      }

      const payload = {
        title,
        message,
        author: currentUser?.name || 'Admin',
        date: new Date().toISOString().split('T')[0],
        mediaItems,
        mediaUrl: mediaItems[0]?.url || null,
        mediaType: mediaItems[0]?.mediaType || 'file'
      };

      const res = await axios.post('/api/announcements', payload);

      setAnnouncements(prev => [res.data.announcement, ...prev]);
      setTitle('');
      setMessage('');
      setUploadFiles([]);
      showToast('Announcement posted successfully!');
    } catch (e) {
      console.error('Post error:', e);
      showToast('Failed to post announcement.', 'error');
    }
  };

  const handleDelete = async (id, item) => {
    try {
      if (item?.mediaItems && item.mediaItems.length > 0) {
        for (const m of item.mediaItems) {
          if (m.url) {
            const filename = m.url.split('/').pop();
            await axios.delete(`/api/upload/${filename}`).catch(() => {});
          }
        }
      } else if (item?.mediaUrl) {
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

  const renderAttachment = (att, parentTitle) => {
    const ext = (att.url || '').split('.').pop().toLowerCase();
    const fileName = att.title || (att.url ? att.url.split('/').pop() : 'Attachment');

    if (att.mediaType === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return (
        <div className="cursor-pointer mb-2" onClick={() => setPreviewItem({ ...att, title: parentTitle })}>
          <img src={att.url} alt={fileName} className="w-full max-h-96 object-contain bg-gray-900 rounded-lg hover:opacity-95 transition" />
        </div>
      );
    }
    if (att.mediaType === 'video' || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return <video src={att.url} controls className="w-full max-h-96 object-contain bg-black rounded-lg mb-2" />;
    }
    if (att.mediaType === 'audio' || ['mp3', 'wav', 'aac'].includes(ext)) {
      return (
        <div className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg flex flex-col items-center justify-center text-white mb-2">
          <i className="fa-solid fa-music text-2xl mb-1 animate-pulse"></i>
          <p className="text-xs font-semibold mb-2">{fileName}</p>
          <audio src={att.url} controls className="w-full max-w-md" />
        </div>
      );
    }
    if (att.mediaType === 'pdf' || ['pdf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem({ ...att, title: parentTitle })} className="w-full bg-red-50 p-4 rounded-lg flex items-center justify-between text-red-600 border border-red-100 cursor-pointer hover:bg-red-100/60 transition mb-2">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-pdf text-3xl"></i>
            <div>
              <p className="font-bold text-sm text-red-800">PDF Document</p>
              <p className="text-xs text-red-600">{fileName} — Click to Preview</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-lg">Preview</span>
        </div>
      );
    }
    if (att.mediaType === 'document' || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem({ ...att, title: parentTitle })} className="w-full bg-blue-50 p-4 rounded-lg flex items-center justify-between text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100/60 transition mb-2">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-lines text-3xl"></i>
            <div>
              <p className="font-bold text-sm text-blue-800">Document</p>
              <p className="text-xs text-blue-600">{fileName} — Click to View</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded-lg">View</span>
        </div>
      );
    }
    if (att.mediaType === 'spreadsheet' || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem({ ...att, title: parentTitle })} className="w-full bg-emerald-50 p-4 rounded-lg flex items-center justify-between text-emerald-600 border border-emerald-100 cursor-pointer hover:bg-emerald-100/60 transition mb-2">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-file-excel text-3xl"></i>
            <div>
              <p className="font-bold text-sm text-emerald-800">Spreadsheet</p>
              <p className="text-xs text-emerald-600">{fileName} — Click to View</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">View</span>
        </div>
      );
    }
    return (
      <div onClick={() => setPreviewItem({ ...att, title: parentTitle })} className="w-full bg-gray-50 p-4 rounded-lg flex items-center justify-between text-gray-700 border border-gray-200 cursor-pointer hover:bg-gray-100 transition mb-2">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-file-arrow-down text-3xl text-primary-600"></i>
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
          <p className="text-gray-500 mt-1 text-sm">Madrasa notices, updates, and multiple file attachments</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Files (Multiple files supported: PDF, Word, Excel, Images, ZIP, etc.)</label>
              <input
                type="file"
                multiple
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
              {uploadFiles.length > 0 && (
                <p className="text-xs text-primary-600 font-semibold mt-1">Selected {uploadFiles.length} file(s) for upload.</p>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors cursor-pointer"
            >
              Post Announcement {uploadFiles.length > 0 ? `(${uploadFiles.length} attachments)` : ''}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading announcements...</div>
        ) : announcements.length > 0 ? (
          announcements.map(item => {
            const attachments = item.mediaItems && item.mediaItems.length > 0
              ? item.mediaItems
              : (item.mediaUrl ? [{ url: item.mediaUrl, mediaType: item.mediaType, title: item.title }] : []);

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">By {item.author || 'Admin'} • {item.date}</p>
                    </div>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(item.id, item)}
                        className="text-red-500 hover:text-red-700 p-2 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm mb-4">{item.message}</p>

                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((att, idx) => (
                        <div key={idx}>
                          {renderAttachment(att, item.title)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No announcements yet.
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-x-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 truncate">{previewItem.title || 'Preview'}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Zoom Out"><i className="fa-solid fa-magnifying-glass-minus"></i></button>
                <span className="text-xs font-bold text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Zoom In"><i className="fa-solid fa-magnifying-glass-plus"></i></button>
                <button onClick={() => setZoom(1)} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer" title="Reset Zoom"><i className="fa-solid fa-rotate-right"></i></button>
                <button onClick={() => setPreviewItem(null)} className="text-gray-500 hover:text-gray-800 p-2 text-lg cursor-pointer ml-2"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-900 min-h-[400px]">
              {previewItem.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || previewItem.mediaType === 'photo' ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              ) : previewItem.url.match(/\.pdf$/i) || previewItem.mediaType === 'pdf' ? (
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }} className="w-full flex items-center justify-center">
                  <iframe src={previewItem.url} title={previewItem.title} className="w-full h-[65vh] rounded-lg bg-white" />
                </div>
              ) : (
                <div className="text-center text-white py-12" style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}>
                  <i className="fa-solid fa-file-arrow-down text-6xl text-primary-400 mb-4"></i>
                  <p className="text-lg font-medium mb-4">File preview available</p>
                  <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow hover:bg-primary-700 transition">
                    Download / Open File
                  </a>
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
