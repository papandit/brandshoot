import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { contentAPI, getFullUrl } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './Models.css';

const Models = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('photoshoot');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState('');
  const [photos, setPhotos] = useState([]);
  const [poses, setPoses] = useState([]);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredModels(models);
    } else {
      setFilteredModels(models.filter(m => m.sub_type === filterType));
    }
  }, [filterType, models]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await contentAPI.getContent('models');
      setModels(data);
      setFilteredModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setModelId('');
    setName('');
    setSubType('photoshoot');
    setImageUrl('');
    setOrder(String(models.length + 1));
    setPhotos([]);
    setPoses([]);
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (model) => {
    resetForm();
    setEditingId(model._id);
    setModelId(model.model_id || '');
    setName(model.name || '');
    setSubType(model.sub_type || 'photoshoot');
    setImageUrl(model.image_url || '');
    setOrder(String(model.order || 0));
    setPhotos(model.photos || []);
    setPoses(model.poses || []);
    setModalVisible(true);
  };

  const handleDelete = async (model) => {
    if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
      try {
        await contentAPI.deleteContent('models', model._id);
        toast.success('Model deleted successfully!');
        loadModels();
      } catch (error) {
        toast.error('Failed to delete model');
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
    if (!modelId || !name) {
      toast.error('Model ID and Name are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        model_id: modelId,
        name: name,
        sub_type: subType,
        image_url: imageUrl,
        order: parseInt(order) || 0,
        photos: subType === 'catalogue' ? photos : [],
        poses: subType === 'branding' ? poses : [],
        before_image_url: subType === 'branding' ? imageUrl : null,
        after_image_url: subType === 'branding' ? imageUrl : null,
      };

      if (editingId) {
        await contentAPI.updateContent('models', editingId, data);
      } else {
        await contentAPI.createContent('models', data);
      }

      toast.success(editingId ? 'Model updated successfully!' : 'Model created successfully!');
      setModalVisible(false);
      loadModels();
    } catch (error) {
      toast.error('Failed to save model');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen size="lg" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="models-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="model-filter-tabs">
          <button 
            className={`model-filter-tab ${filterType === 'all' ? 'model-filter-tab-active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({models.length})
          </button>
          <button 
            className={`model-filter-tab ${filterType === 'photoshoot' ? 'model-filter-tab-active' : ''}`}
            onClick={() => setFilterType('photoshoot')}
          >
            Photoshoot ({models.filter(m => m.sub_type === 'photoshoot').length})
          </button>
          <button 
            className={`model-filter-tab ${filterType === 'catalogue' ? 'model-filter-tab-active' : ''}`}
            onClick={() => setFilterType('catalogue')}
          >
            Catalogue ({models.filter(m => m.sub_type === 'catalogue').length})
          </button>
          <button 
            className={`model-filter-tab ${filterType === 'branding' ? 'model-filter-tab-active' : ''}`}
            onClick={() => setFilterType('branding')}
          >
            Branding ({models.filter(m => m.sub_type === 'branding').length})
          </button>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
          Add Model
        </Button>
      </div>

      <motion.div 
        className="models-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={filterType}
      >
        {filteredModels.length === 0 ? (
          <Card><div className="empty-state">No models found</div></Card>
        ) : (
          filteredModels.map((model) => (
            <motion.div key={model._id} variants={itemVariants}>
              <Card className="model-card">
              <div className="model-image-container">
                {model.image_url ? (
                  <img src={getFullUrl(model.image_url)} alt={model.name} className="model-image" />
                ) : (
                  <div className="model-image-placeholder">
                    <ImageIcon size={32} color="var(--color-muted)" />
                  </div>
                )}
              </div>
              <div className="model-info">
                <div className="model-header-row">
                  <h3 className="model-name">{model.name}</h3>
                  <span className={`model-type-badge model-type-${model.sub_type}`}>
                    {model.sub_type === 'photoshoot' && '📸'}
                    {model.sub_type === 'catalogue' && '📋'}
                    {model.sub_type === 'branding' && '🎨'}
                  </span>
                </div>
                <p className="model-meta">ID: {model.model_id}</p>
                {model.sub_type === 'catalogue' && model.photos?.length > 0 && (
                  <p className="model-detail">{model.photos.length} photos</p>
                )}
                {model.sub_type === 'branding' && model.poses?.length > 0 && (
                  <p className="model-detail">{model.poses.length} poses</p>
                )}
              </div>
              <div className="model-actions">
                <button className="model-icon-btn" onClick={() => handleEdit(model)}>
                  <Pencil size={16} color="var(--color-accent)" />
                </button>
                <button className="model-icon-btn model-icon-btn-danger" onClick={() => handleDelete(model)}>
                  <Trash2 size={16} color="var(--color-error)" />
                </button>
              </div>
            </Card>
          </motion.div>
          ))
        )}
      </motion.div>

      {/* Edit/Add Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? 'Edit Model' : 'Add Model'} size="lg">
        <div className="model-form">
          {/* Sub Type Selector */}
          <div className="subtype-selector">
            {['photoshoot', 'catalogue', 'branding'].map(type => (
              <button
                key={type}
                className={`subtype-btn ${subType === type ? 'subtype-btn-active' : ''}`}
                onClick={() => setSubType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="form-scroll">
            {/* Basic Info */}
            <h3 className="form-section-title">Basic Information</h3>
            <input className="form-input" placeholder="Model ID (e.g. m1, indian-man)" value={modelId} onChange={(e) => setModelId(e.target.value)} />
            <input className="form-input" placeholder="Name (e.g. Indian Man)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="form-input" type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} />

            {/* Thumbnail Image */}
            <h3 className="form-section-title">Thumbnail Image</h3>
            <div className="upload-box-large">
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  setImageUrl(url);
                }
              }} style={{ display: 'none' }} id="model-thumbnail" />
              <label htmlFor="model-thumbnail" className="upload-label-large">
                {imageUrl ? <img src={getFullUrl(imageUrl)} alt="Thumbnail" className="upload-img" /> : <ImageIcon size={32} />}
                <span>Thumbnail</span>
              </label>
            </div>

            {/* Catalogue Photos */}
            {subType === 'catalogue' && (
              <div>
                <div className="array-header">
                  <h3 className="form-section-title">Catalogue Photos</h3>
                  <button className="add-item-btn" onClick={() => setPhotos([...photos, { id: Date.now().toString(), label: 'New View', type: 'model', image_url: '' }])}>
                    + Add Photo
                  </button>
                </div>
                {photos.map((photo, idx) => (
                  <div key={idx} className="dynamic-block">
                    <div className="dynamic-block-header">
                      <span>Photo {idx + 1}</span>
                      <button onClick={() => { const p = [...photos]; p.splice(idx, 1); setPhotos(p); }}>
                        <Trash2 size={18} color="var(--color-error)" />
                      </button>
                    </div>
                    <div className="dynamic-row">
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const p = [...photos];
                            p[idx].image_url = url;
                            setPhotos(p);
                          }
                        }} style={{ display: 'none' }} id={`photo-${idx}`} />
                        <label htmlFor={`photo-${idx}`} className="upload-label">
                          {photo.image_url ? <img src={getFullUrl(photo.image_url)} alt="Photo" className="upload-img" /> : <ImageIcon size={20} />}
                        </label>
                      </div>
                      <div className="dynamic-inputs">
                        <input className="form-input-small" placeholder="Label" value={photo.label} onChange={(e) => { const p = [...photos]; p[idx].label = e.target.value; setPhotos(p); }} />
                        <input className="form-input-small" placeholder="Type (model/studio)" value={photo.type} onChange={(e) => { const p = [...photos]; p[idx].type = e.target.value; setPhotos(p); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Branding Poses */}
            {subType === 'branding' && (
              <div>
                <div className="array-header">
                  <h3 className="form-section-title">Branding Poses</h3>
                  <button className="add-item-btn" onClick={() => setPoses([...poses, { id: Date.now().toString(), label: 'New View', image_url: '' }])}>
                    + Add Pose
                  </button>
                </div>
                {poses.map((pose, idx) => (
                  <div key={idx} className="dynamic-block">
                    <div className="dynamic-block-header">
                      <span>Pose {idx + 1}</span>
                      <button onClick={() => { const p = [...poses]; p.splice(idx, 1); setPoses(p); }}>
                        <Trash2 size={18} color="var(--color-error)" />
                      </button>
                    </div>
                    <div className="dynamic-row">
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const p = [...poses];
                            p[idx].image_url = url;
                            setPoses(p);
                          }
                        }} style={{ display: 'none' }} id={`pose-${idx}`} />
                        <label htmlFor={`pose-${idx}`} className="upload-label">
                          {pose.image_url ? <img src={getFullUrl(pose.image_url)} alt="Pose" className="upload-img" /> : <ImageIcon size={20} />}
                        </label>
                      </div>
                      <div className="dynamic-inputs">
                        <input className="form-input-small" placeholder="Label (e.g. Front View)" value={pose.label} onChange={(e) => { const p = [...poses]; p[idx].label = e.target.value; setPoses(p); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="primary" fullWidth loading={saving} onClick={handleSave} style={{ marginTop: '16px' }}>
            Save Model
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Models;
