import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { contentAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './Prompts.css';

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [templateId, setTemplateId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('system');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await contentAPI.getContent('prompts');
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      alert('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTemplateId('');
    setName('');
    setType('system');
    setContent('');
    setIsActive(true);
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (prompt) => {
    resetForm();
    setEditingId(prompt._id);
    setTemplateId(prompt.template_id || '');
    setName(prompt.name || '');
    setType(prompt.type || 'system');
    setContent(prompt.content || '');
    setIsActive(prompt.is_active !== false);
    setModalVisible(true);
  };

  const handleDelete = async (prompt) => {
    if (window.confirm(`Are you sure you want to delete ${prompt.name}?`)) {
      try {
        await contentAPI.deleteContent('prompts', prompt._id);
        loadPrompts();
      } catch (error) {
        alert('Failed to delete prompt');
      }
    }
  };

  const handleSave = async () => {
    if (!templateId || !name || !content) {
      alert('Template ID, Name and Content are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        template_id: templateId,
        name: name,
        type: type,
        content: content,
        is_active: isActive,
      };

      if (editingId) {
        await contentAPI.updateContent('prompts', editingId, data);
      } else {
        await contentAPI.createContent('prompts', data);
      }

      setModalVisible(false);
      loadPrompts();
    } catch (error) {
      alert('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen size="lg" />;
  }

  return (
    <div className="prompts-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
          Add Prompt
        </Button>
      </div>

      <div className="prompts-list">
        {prompts.length === 0 ? (
          <Card><div className="empty-state">No prompt templates found</div></Card>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt._id} className="prompt-card">
              <div className="prompt-header">
                <div className="prompt-title-row">
                  <FileText size={20} color="var(--color-accent)" />
                  <h3 className="prompt-name">{prompt.name}</h3>
                  <span className={`prompt-badge ${prompt.type}`}>{prompt.type}</span>
                  <span className={`prompt-status ${prompt.is_active !== false ? 'active' : 'inactive'}`}>
                    {prompt.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="prompt-actions">
                  <button className="prompt-icon-btn" onClick={() => handleEdit(prompt)}>
                    <Pencil size={16} color="var(--color-accent)" />
                  </button>
                  <button className="prompt-icon-btn danger" onClick={() => handleDelete(prompt)}>
                    <Trash2 size={16} color="var(--color-error)" />
                  </button>
                </div>
              </div>
              <p className="prompt-meta">ID: {prompt.template_id}</p>
              <pre className="prompt-content">{prompt.content}</pre>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? 'Edit Prompt' : 'Add Prompt'} size="md">
        <div className="prompt-form">
          <div className="form-scroll">
            <h3 className="form-section-title">Basic Information</h3>
            <input className="form-input" placeholder="Template ID (e.g. system_prompt)" value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
            <input className="form-input" placeholder="Name (e.g. System Prompt)" value={name} onChange={(e) => setName(e.target.value)} />

            <h3 className="form-section-title">Type</h3>
            <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="system">system</option>
              <option value="quality">quality</option>
              <option value="custom">custom</option>
            </select>

            <h3 className="form-section-title">Prompt Content</h3>
            <textarea
              className="form-input prompt-textarea"
              placeholder="Enter the prompt text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />

            <label className="prompt-active-row">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>Active</span>
            </label>
          </div>

          <Button variant="primary" fullWidth loading={saving} onClick={handleSave} style={{ marginTop: '16px' }}>
            Save Prompt
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Prompts;
