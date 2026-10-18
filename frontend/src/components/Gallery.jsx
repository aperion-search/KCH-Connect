import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Gallery() {
  const { currentUser, students, teachers, showToast, gallery, saveGallery } = useApp();
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

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
        console.error('Failed to delete media from server/Mega:', e);
      }
    }
    const updated = folders.map(f => f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f);
    setFolders(updated);
    saveGallery(updated);
    showToast('Item deleted');
  };

  const handleUpload = () => {
    if (!uploadFile || !selectedFolder) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target.result;
      try {
        const res = await axios.post('/api/upload', {
          image: base64Url,
          filename: uploadFile.name
        });
        const mediaUrl = res.data.url;
        const newItem = {
          id: Date.now(),
          type: uploadFile.type.startsWith('video') ? 'video' : 'photo',
          url: mediaUrl,
          title: uploadFile.name
        };
        const updated = folders.map(f => f.id === selectedFolder ? { ...f, items: [...f.items, newItem] } : f);
        setFolders(updated);
        saveGallery(updated);
        setUploadFile(null);
        showToast('Media uploaded and synced successfully!');
      } catch (err) {
        console.error('Upload error:', err);
        showToast('Failed to upload media file', 'error');
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Gallery</h1>

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
            <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New event..." className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-40 bg-white" />
            <button onClick={handleAddFolder} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold cursor-pointer">Create</button>
          </div>
        )}
      </div>

      {/* Admin upload inside folder */}
      {isAdmin && selectedFolder && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <h3 className="font-semibold mb-2 text-sm text-gray-800">Add Media to {currentFolder?.name}</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input type="file" accept="image/*,video/*" onChange={e => setUploadFile(e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
            <button onClick={handleUpload} disabled={!uploadFile} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition disabled:opacity-50 cursor-pointer">Upload</button>
          </div>
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(currentFolder?.items || []).map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {item.type === 'video' ? <video src={item.url} controls className="w-full h-48 object-cover bg-black" /> : <img src={item.url} alt={item.title} className="w-full h-48 object-cover" />}
            <div className="p-4 flex justify-between items-center">
              <h4 className="font-medium text-sm text-gray-800 truncate pr-2">{item.title}</h4>
              {isAdmin && (
                <button onClick={() => handleDeleteItem(selectedFolder, item.id)} className="text-red-600 hover:text-red-700 p-1 cursor-pointer flex-shrink-0" title="Delete"><i className="fa-solid fa-trash-can"></i></button>
              )}
            </div>
          </div>
        ))}
        {(currentFolder?.items || []).length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12 text-sm">No media in this event folder yet.</div>
        )}
      </div>
    </div>
  );
}
