import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Image as ImageIcon, Palette } from 'lucide-react';
import { contentAPI, getFullUrl } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './Backgrounds.css';

const Backgrounds = () => {
  const navigate = useNavigate();
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [bgId, setBgId] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState('');

  useEffect(() => {
    loadBackgrounds();
  }, []);

  const loadBackgrounds = async () => {
    setLoading(true);
    try {
      const data = await contentAPI.getContent('backgrounds');
      setBackgrounds(data);
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
      alert('Failed to load backgrounds');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setBgId('');
    setLabel('');
    setColor('');
    setImageUrl('');
    setOrder(String(backgrounds.length + 1));
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (bg) => {
    resetForm();
    setEditingId(bg._id);
    setBgId(bg.bg_id || '');
    setLabel(bg.label || '');
    setColor(bg.color || '');
    setImageUrl(bg.image_url || '');
    setOrder(String(bg.order || 0));
    setModalVisible(true);
  };

  const handleDelete = async (bg) => {
    if (window.confirm(`Are you sure you want to delete ${bg.label}?`)) {
      try {
        await contentAPI.deleteContent('backgrounds', bg._id);
        loadBackgrounds();
      } catch (error) {
        alert('Failed to delete background');
      }
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return '';
    try {
      const result = await contentAPI.uploadImage(file);
      return result.url;
    } catch (error) {
      console.error('Upload failed:', error);
      return '';
    }
  };

  const handleSave = async () => {
    if (!bgId || !label) {
      alert('Background ID and Label are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        bg_id: bgId,
        label: label,
        color: color,
        image_url: imageUrl,
        order: parseInt(order) || 0,
      };

      if (editingId) {
        await contentAPI.updateContent('backgrounds', editingId, data);
      } else {
        await contentAPI.createContent('backgrounds', data);
      }

      setModalVisible(false);
      loadBackgrounds();
    } catch (error) {
      alert('Failed to save background');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen size="lg" />;
  }

  return (
    <div className="backgrounds-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
          Add Background
        </Button>
      </div>

      <div className="backgrounds-grid">
        {backgrounds.length === 0 ? (
          <Card><div className="empty-state">No backgrounds found</div></Card>
        ) : (
          backgrounds.map((bg) => (
            <Card key={bg._id} className="bg-card">
              <div className="bg-preview-container">
                {bg.image_url ? (
                  <img src={getFullUrl(bg.image_url)} alt={bg.label} className="bg-preview-image" />
                ) : bg.color ? (
                  <div className="bg-preview-color" style={{ backgroundColor: bg.color }} />
                ) : (
                  <div className="bg-preview-placeholder">
                    <Palette size={32} color="var(--color-muted)" />
                  </div>
                )}
              </div>
              <div className="bg-info">
                <h3 className="bg-name">{bg.label}</h3>
                <p className="bg-meta">ID: {bg.bg_id}</p>
                {bg.color && <p className="bg-detail">{bg.color}</p>}
              </div>
              <div className="bg-actions">
                <button className="bg-icon-btn" onClick={() => handleEdit(bg)}>
                  <Pencil size={16} color="var(--color-accent)" />
                </button>
                <button className="bg-icon-btn bg-icon-btn-danger" onClick={() => handleDelete(bg)}>
                  <Trash2 size={16} color="var(--color-error)" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? 'Edit Background' : 'Add Background'} size="md">
        <div className="bg-form">
          <div className="form-scroll">
            {/* Basic Info */}
            <h3 className="form-section-title">Basic Information</h3>
            <input className="form-input" placeholder="Background ID (e.g. bg-white)" value={bgId} onChange={(e) => setBgId(e.target.value)} />
            <input className="form-input" placeholder="Label (e.g. Pure White)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <input className="form-input" type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} />

            {/* Background Source */}
            <h3 className="form-section-title">Background Source</h3>
            <p className="form-hint">Provide EITHER a HEX Color OR an Image File</p>

            <input 
              className="form-input" 
              placeholder="Color (e.g. #FFFFFF)" 
              value={color} 
              onChange={(e) => { 
                setColor(e.target.value); 
                if (e.target.value) setImageUrl(''); 
              }} 
            />
            
            <div className="color-preview-container">
              {color && (
                <div className="color-preview" style={{ backgroundColor: color }}>
                  <span>{color}</span>
                </div>
              )}
            </div>

            <p className="form-divider">OR</p>

            <div className="upload-box-bg">
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  setImageUrl(url);
                  setColor('');
                }
              }} style={{ display: 'none' }} id="bg-image" />
              <label htmlFor="bg-image" className="upload-label-bg">
                {imageUrl ? <img src={getFullUrl(imageUrl)} alt="Background" className="upload-img" /> : <ImageIcon size={32} />}
                <span>Upload Texture/Image</span>
              </label>
            </div>
          </div>

          <Button variant="primary" fullWidth loading={saving} onClick={handleSave} style={{ marginTop: '16px' }}>
            Save Background
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Backgrounds;
