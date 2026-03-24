import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  LayoutGrid, 
  Download,
  ShieldCheck,
  Globe,
  RefreshCw
} from 'lucide-react';

const CLOUD_API = 'https://baixabaixa.onrender.com/api';
const API_KEY = 'baixabaixa-secret-2026';

const api = axios.create({
  baseURL: CLOUD_API,
  headers: { 'x-api-key': API_KEY }
});

function App() {
  const [channels, setChannels] = useState([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSavePath, setNewSavePath] = useState('');
  const [newType, setNewType] = useState('live');

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(fetchChannels, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await api.get('/channels');
      setChannels(res.data);
    } catch (err) {
      console.error('Erro ao buscar canais:', err);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newName || !newUrl) return;
    try {
      await api.post('/channels', { 
        name: newName, 
        url: newUrl, 
        type: newType, 
        save_path: newSavePath 
      });
      setNewName('');
      setNewUrl('');
      setNewSavePath('');
      fetchChannels();
    } catch (err) {
      console.error('Erro ao adicionar:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este link?')) {
      try {
        await api.delete(`/channels/${id}`);
        fetchChannels();
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const handleRetry = async (id) => {
    try {
      await api.post(`/channels/${id}/retry`);
      fetchChannels();
    } catch (err) {
      console.error('Erro ao refazer:', err);
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return { label: 'Pendente', color: '#f59e0b' };
      case 'downloading': return { label: 'Baixando...', color: '#3b82f6' };
      case 'monitoring': return { label: 'Monitorando Live', color: '#10b981' };
      case 'completed': return { label: 'Concluído', color: '#10b981' };
      case 'error': return { label: 'Erro', color: '#ef4444' };
      default: return { label: status, color: '#6b7280' };
    }
  };

  return (
    <div className="dashboard">
      <header>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Globe size={24} color="var(--primary)" /> BaixaBaixa Cloud
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.8rem' }}>
          <ShieldCheck size={14} /> Agent Secured
        </div>
      </header>

      <main>
        <section className="glass-card" style={{ marginBottom: '3rem', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Adicionar para Download</h2>
          <form onSubmit={handleAddChannel} className="add-channel-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input placeholder="Nome (Ex: Video Legal)" value={newName} onChange={e => setNewName(e.target.value)} required />
            <input placeholder="URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} required />
            <input placeholder="Fila/Pasta (Opcional)" value={newSavePath} onChange={e => setNewSavePath(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select value={newType} onChange={e => setNewType(e.target.value)} style={{ flex: 1 }}>
                <option value="live">Live (Streaming)</option>
                <option value="posts">Posts (Fotos/Vídeos)</option>
              </select>
              <button type="submit" style={{ padding: '0 2rem' }}><Plus size={20}/></button>
            </div>
          </form>
        </section>

        <div className="channel-grid">
          {channels.map(channel => {
            const status = getStatusLabel(channel.status);
            return (
              <div key={channel._id} className="glass-card channel-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.3rem' }}>{channel.name}</h3>
                    <p style={{ opacity: 0.5, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {channel.url}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(channel._id)} className="btn-danger" title="Excluir">
                    <Trash2 size={16}/>
                  </button>
                </div>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div className="status-dot" style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}` }} />
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    {status.label}
                  </span>
                  {channel.status === 'error' && (
                    <button 
                      onClick={() => handleRetry(channel._id)} 
                      className="btn-retry" 
                      title="Tentar Novamente"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>

                {channel.status === 'error' && channel.message && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#ef4444', opacity: 0.9, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: '4px' }}>
                    {channel.message}
                  </div>
                )}

                {channel.save_path && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                     <Download size={12}/> Destino: {channel.save_path}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
