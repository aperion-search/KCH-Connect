import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Gallery() {
  const { currentUser, showToast, gallery, saveGallery } = useApp();
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [zoom, setZoom] = useState(1);
  const isAdmin = currentUser?.role === 'admin';

  React.useEffect(() => {
    setZoom(1);
  }, [previewItem]);

  React.useEffect(() => {
    if (gallery && gallery.length > 0) {
      setFolders(gallery);
      if (!selectedFolder || !gallery.some(f => f.id === selectedFolder)) {
        setSelectedFolder(gallery[0].id);
      }
    }
  }, [gallery]);

  const currentFolder = folders.find(f => f.id === selectedFolder) || folders[0];

  const handleAddFolder = () => {
    if (!newFolder.trim()) return;
    const folder = { id: Date.now(), name: newFolder.trim(), date: new Date().toISOString().split('T')[0], items: [] };
    const updated = [folder, ...folders];
    setFolders(updated);
    saveGallery(updated);
    setSelectedFolder(folder.id);
    setNewFolder('');
    showToast('Folder created');
  };

  const handleDeleteFolder = (id) => {
    const updated = folders.filter(f => f.id !== id);
    setFolders(updated);
    saveGallery(updated);
    if (selectedFolder === id) setSelectedFolder(updated[0]?.id || null);
    showToast('Folder removed');
  };

  const handleDeleteItem = async (folderId, itemId) => {
    const folder = folders.find(f => f.id === folderId);
    const item = folder?.items?.find(i => i.id === itemId);
    if (item && item.url) {
      const filename = item.url.split('/').pop();
      try {
        await axios.delete(`/api/upload/${filename}`);
      } catch (e) {
        console.error('Failed to delete media from server/Bucket:', e);
      }
    }
    const updated = folders.map(f => f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f);
    setFolders(updated);
    saveGallery(updated);
    showToast('Item deleted');
  };

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0 || !selectedFolder) return;
    const newItems = [];
    for (const file of uploadFiles) {
      try {
        const reader = new FileReader();
        const base64Url = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await axios.post('/api/upload', {
          image: base64Url,
          filename: file.name
        });
        const mediaUrl = res.data.url;
        const ext = file.name.split('.').pop().toLowerCase();
        let fileType = 'file';
        if (file.type.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
          fileType = 'photo';
        } else if (file.type.startsWith('video') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
          fileType = 'video';
        } else if (file.type.startsWith('audio') || ['mp3', 'wav', 'aac'].includes(ext)) {
          fileType = 'audio';
        } else if (['pdf'].includes(ext)) {
          fileType = 'pdf';
        } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
          fileType = 'document';
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
          fileType = 'spreadsheet';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
          fileType = 'archive';
        }

        newItems.push({
          id: Date.now() + Math.random(),
          type: fileType,
          url: mediaUrl,
          title: file.name
        });
      } catch (err) {
        console.error('Upload error for file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      const updated = folders.map(f => f.id === selectedFolder ? { ...f, items: [...(f.items || []), ...newItems] } : f);
      setFolders(updated);
      saveGallery(updated);
      setUploadFiles([]);
      showToast(`${newItems.length} file(s) uploaded and synced successfully!`);
    } else {
      showToast('Failed to upload files', 'error');
    }
  };

  const renderFileThumbnail = (item) => {
    const ext = (item.title || item.url).split('.').pop().toLowerCase();
    if (item.type === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <img src={item.url} alt={item.title} className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition" onClick={() => setPreviewItem(item)} />;
    }
    if (item.type === 'video' || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return <video src={item.url} controls className="w-full h-48 object-cover bg-black" />;
    }
    if (item.type === 'audio' || ['mp3', 'wav', 'aac'].includes(ext)) {
      return (
        <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col items-center justify-center text-white p-4">
          <i className="fa-solid fa-music text-4xl mb-2 animate-pulse"></i>
          <audio src={item.url} controls className="w-full mt-2" />
        </div>
      );
    }
    if (item.type === 'pdf' || ['pdf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full h-48 bg-red-50 flex flex-col items-center justify-center text-red-600 p-4 border-b border-red-100 cursor-pointer hover:bg-red-100/60 transition">
          <i className="fa-solid fa-file-pdf text-5xl mb-2"></i>
          <span className="text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 px-3 py-1 rounded-full shadow-xs">PDF Document</span>
          <span className="text-[11px] text-gray-500 mt-1">Click to Preview</span>
        </div>
      );
    }
    if (item.type === 'document' || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full h-48 bg-blue-50 flex flex-col items-center justify-center text-blue-600 p-4 border-b border-blue-100 cursor-pointer hover:bg-blue-100/60 transition">
          <i className="fa-solid fa-file-lines text-5xl mb-2"></i>
          <span className="text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow-xs">Document</span>
          <span className="text-[11px] text-gray-500 mt-1">Click to Preview</span>
        </div>
      );
    }
    if (item.type === 'spreadsheet' || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return (
        <div onClick={() => setPreviewItem(item)} className="w-full h-48 bg-emerald-50 flex flex-col items-center justify-center text-emerald-600 p-4 border-b border-emerald-100 cursor-pointer hover:bg-emerald-100/60 transition">
          <i className="fa-solid fa-file-excel text-5xl mb-2"></i>
          <span className="text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full shadow-xs">Spreadsheet</span>
          <span className="text-[11px] text-gray-500 mt-1">Click to Preview</span>
        </div>
      );
    }
    if (item.type === 'archive' || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return (
        <div className="w-full h-48 bg-amber-50 flex flex-col items-center justify-center text-amber-600 p-4 border-b border-amber-100">
          <i className="fa-solid fa-file-zipper text-5xl mb-2"></i>
          <span className="text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-3 py-1 rounded-full shadow-xs">Archive / ZIP</span>
        </div>
      );
    }
    return (
      <div onClick={() => setPreviewItem(item)} className="w-full h-48 bg-gray-50 flex flex-col items-center justify-center text-gray-600 p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition">
        <i className="fa-solid fa-file-arrow-down text-5xl mb-2 text-primary-500"></i>
        <span className="text-xs font-bold uppercase tracking-wide bg-gray-200 text-gray-700 px-3 py-1 rounded-full shadow-xs">{ext || 'File'} Format</span>
        <span className="text-[11px] text-gray-500 mt-1">Click to View</span>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Gallery & File Bucket</h1>

      {/* Folders bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {folders.map(f => (
          <div key={f.id} className={`flex items-center gap-2 flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition ${selectedFolder === f.id ? 'bg-madrasa-blue text-white border-madrasa-blue' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
            <button onClick={() => setSelectedFolder(f.id)} className="cursor-pointer">
              {f.name}
            </button>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(f.id);
                }}
                className="text-red-400 hover:text-red-200 cursor-pointer p-1"
                title="Delete Event Folder"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            )}
          </div>
        ))}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New event folder..." className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-40 bg-white" />
            <button onClick={handleAddFolder} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold cursor-pointer">Create</button>
          </div>
        )}
      </div>

      {/* Admin upload inside folder */}
      {isAdmin && selectedFolder && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <h3 className="font-semibold mb-2 text-sm text-gray-800">Add Files / Media of Any Format to {currentFolder?.name}</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input type="file" multiple onChange={e => setUploadFiles(Array.from(e.target.files || []))} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
            <button onClick={handleUpload} disabled={uploadFiles.length === 0} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition disabled:opacity-50 cursor-pointer">
              Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''} to Bucket
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Supports multiple files simultaneously (images, videos, PDFs, Word docs, Excel sheets, ZIP archives, etc.).</p>
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(currentFolder?.items || []).map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col justify-between">
            <div>
              {renderFileThumbnail(item)}
            </div>
            <div className="p-4 flex justify-between items-center bg-white">
              <h4 className="font-medium text-sm text-gray-800 truncate pr-2" title={item.title}>{item.title}</h4>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => handleDeleteItem(selectedFolder, item.id)} className="text-red-600 hover:text-red-700 p-1 cursor-pointer flex-shrink-0" title="Delete"><i className="fa-solid fa-trash-can"></i></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {(currentFolder?.items || []).length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12 text-sm bg-white rounded-2xl border border-gray-100">No files in this event folder yet.</div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 truncate">{previewItem.title}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Zoom Out"><i className="fa-solid fa-magnifying-glass-minus"></i></button>
                <span className="text-xs font-bold text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Zoom In"><i className="fa-solid fa-magnifying-glass-plus"></i></button>
                <button onClick={() => setZoom(1)} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer" title="Reset Zoom"><i className="fa-solid fa-rotate-right"></i></button>
                <button onClick={() => setPreviewItem(null)} className="text-gray-500 hover:text-gray-800 p-2 text-lg cursor-pointer ml-2"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-900 min-h-[400px]">
              {previewItem.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || previewItem.type === 'photo' ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              ) : previewItem.url.match(/\.pdf$/i) || previewItem.type === 'pdf' ? (
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }} className="w-full flex items-center justify-center">
                  <iframe src={previewItem.url} title={previewItem.title} className="w-full h-[65vh] rounded-lg bg-white" />
                </div>
              ) : (
                <div className="text-center text-white py-12" style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}>
                  <i className="fa-solid fa-file-arrow-down text-6xl text-primary-400 mb-4"></i>
                  <p className="text-lg font-medium mb-4">Preview available</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 gap-3">
              <button onClick={() => setPreviewItem(null)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
