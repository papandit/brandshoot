import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, X, Image as ImageIcon, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import * as Icons from 'react-icons/io5';
import { contentAPI, getFullUrl } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './Categories.css';

const CAT_LABELS = ["Side View", "Sitting", "Product View", "Key Highlights", "Before"];

const Categories = () => {
  const prompt_rows = 10;
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [expandedPrompts, setExpandedPrompts] = useState(new Set());
  const [expandedTabs, setExpandedTabs] = useState({});

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('diamond');
  const [order, setOrder] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [shootPrompt, setShootPrompt] = useState('');
  const [cataloguePrompt, setCataloguePrompt] = useState('');
  const [brandingPrompt, setBrandingPrompt] = useState('');
  const [photoshoots, setPhotoshoots] = useState([]);
  const [brandings, setBrandings] = useState([]);
  const [catalogues, setCatalogues] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await contentAPI.getContent('categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePrompt = (catId, promptType) => {
    const key = `${catId}_${promptType}`;
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const setExpandedTab = (catId, tab) => {
    setExpandedTabs(prev => ({
      ...prev,
      [catId]: tab
    }));
  };

  const getExpandedTab = (catId, items) => {
    if (expandedTabs[catId]) return expandedTabs[catId];
    // Default to first available tab
    if (items.photoshoot?.length > 0) return 'photoshoot';
    if (items.catalogue?.length > 0) return 'catalogue';
    if (items.branding?.length > 0) return 'branding';
    return 'photoshoot';
  };

  const resetForm = () => {
    setEditingId(null);
    setCategoryId('');
    setTitle('');
    setIcon('IoDiamond');
    setOrder(String(categories.length + 1));
    setIsActive(true);
    setShootPrompt('');
    setCataloguePrompt('');
    setBrandingPrompt('');
    setPhotoshoots([]);
    setBrandings([]);
    setCatalogues([]);
    setActiveTab('basic');
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (cat) => {
    resetForm();
    setEditingId(cat._id);
    setCategoryId(cat.category_id || '');
    setTitle(cat.title || '');
    setIcon(cat.icon || 'IoDiamond');
    setOrder(String(cat.order || 0));
    setIsActive(cat.is_active !== undefined ? cat.is_active : true);

    const p = cat.prompts || {};
    setShootPrompt(p.shoot || '');
    setCataloguePrompt(p.catalogue || '');
    setBrandingPrompt(p.branding || '');

    const items = cat.showcase_items || {};
    setPhotoshoots(items.photoshoot?.map(p => ({ ...p })) || []);
    setBrandings(items.branding?.map(b => ({ ...b })) || []);
    
    if (items.catalogue && items.catalogue.length > 0) {
      setCatalogues(items.catalogue.map(c => {
        const thumbs = c.thumbnails || [];
        const newCatImgs = ['', '', '', '', ''];
        for (let i = 0; i < 5; i++) {
          if (thumbs[i]) newCatImgs[i] = thumbs[i].image_url || '';
        }
        return { id: c.id || '', thumbnails: newCatImgs };
      }));
    } else {
      setCatalogues([]);
    }

    setModalVisible(true);
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`Are you sure you want to delete ${cat.title}?`)) {
      try {
        await contentAPI.deleteContent('categories', cat._id);
        toast.success('Category deleted successfully!');
        loadCategories();
      } catch (error) {
        toast.error('Failed to delete category');
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
    if (!categoryId || !title) {
      toast.error('Category ID and Title are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        category_id: categoryId,
        title: title,
        icon: icon,
        order: parseInt(order) || 0,
        is_active: isActive,
        subcategories: ['photoshoot', 'catalogue', 'branding'],
        prompts: {
          shoot: shootPrompt,
          catalogue: cataloguePrompt,
          branding: brandingPrompt
        },
        showcase_items: {
          photoshoot: photoshoots.map((ps, i) => ({
            id: ps.id || `${categoryId}_ps${i + 1}`,
            before_url: ps.before_url || '',
            after_url: ps.after_url || ''
          })),
          branding: brandings.map((br, i) => ({
            id: br.id || `${categoryId}_br${i + 1}`,
            before_url: br.before_url || '',
            after_url: br.after_url || ''
          })),
          catalogue: catalogues.map((cat, i) => ({
            id: cat.id || `${categoryId}_cat${i + 1}`,
            thumbnails: cat.thumbnails.map((img, idx) => ({
              label: CAT_LABELS[idx],
              image_url: img || ''
            }))
          }))
        }
      };

      if (editingId) {
        await contentAPI.updateContent('categories', editingId, data);
        toast.success('Category updated successfully!');
      } else {
        await contentAPI.createContent('categories', data);
        toast.success('Category created successfully!');
      }

      setModalVisible(false);
      loadCategories();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const renderImageCard = (url, label) => {
    if (!url) {
      return (
        <div className="image-box-empty">
          <ImageIcon size={24} color="var(--color-muted)" />
          <span className="image-box-label">{label}</span>
        </div>
      );
    }
    return (
      <div className="image-box">
        <img src={getFullUrl(url)} alt={label} className="showcase-img" />
        <span className="image-box-label">{label}</span>
      </div>
    );
  };

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName] || Icons.IoDiamond;
    return <IconComponent size={20} />;
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
    <div className="categories-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
          Add Category
        </Button>
      </div>

      <motion.div 
        className="categories-list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.length === 0 ? (
          <Card><div className="empty-state">No categories found</div></Card>
        ) : (
          categories.map((cat) => {
            const items = cat.showcase_items || {};
            const isExpanded = expandedIds.has(cat._id);

            return (
              <motion.div key={cat._id} variants={itemVariants}>
                <Card className="cat-card">
                <div className="cat-card-header" onClick={() => toggleExpand(cat._id)}>
                  <div className="cat-title-row">
                    <div className="cat-icon-circle">
                      {renderIcon(cat.icon)}
                    </div>
                    <div className="cat-info-col">
                      <h3 className="cat-card-title">{cat.title}</h3>
                      <p className="cat-card-subtitle">ID: {cat.category_id} • Order: {cat.order}</p>
                      <div className="cat-quick-stats">
                        <span className={`cat-stat-badge ${cat.is_active ? 'status-active' : 'status-inactive'}`}>
                          <Power size={12} /> {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {items.photoshoot?.length > 0 && (
                          <span className="cat-stat-badge">📸 {items.photoshoot.length}</span>
                        )}
                        {items.catalogue?.length > 0 && (
                          <span className="cat-stat-badge">📋 {items.catalogue.length}</span>
                        )}
                        {items.branding?.length > 0 && (
                          <span className="cat-stat-badge">🎨 {items.branding.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="cat-card-actions">
                    <button className="cat-icon-btn" onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}>
                      <Pencil size={18} color="var(--color-accent)" />
                    </button>
                    <button className="cat-icon-btn cat-icon-btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}>
                      <Trash2 size={18} color="var(--color-error)" />
                    </button>
                    <div className="cat-chevron">
                      {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="cat-expanded-content">
                    {/* Tabs */}
                    <div className="cat-tabs-container">
                      {items.photoshoot?.length > 0 && (
                        <button 
                          className={`cat-tab ${getExpandedTab(cat._id, items) === 'photoshoot' ? 'cat-tab-active' : ''}`}
                          onClick={() => setExpandedTab(cat._id, 'photoshoot')}
                        >
                          Photoshoot ({items.photoshoot.length})
                        </button>
                      )}
                      {items.catalogue?.length > 0 && (
                        <button 
                          className={`cat-tab ${getExpandedTab(cat._id, items) === 'catalogue' ? 'cat-tab-active' : ''}`}
                          onClick={() => setExpandedTab(cat._id, 'catalogue')}
                        >
                          Catalogue ({items.catalogue.length})
                        </button>
                      )}
                      {items.branding?.length > 0 && (
                        <button 
                          className={`cat-tab ${getExpandedTab(cat._id, items) === 'branding' ? 'cat-tab-active' : ''}`}
                          onClick={() => setExpandedTab(cat._id, 'branding')}
                        >
                          Branding ({items.branding.length})
                        </button>
                      )}
                    </div>

                    {/* Tab Content */}
                    <div className="cat-tab-content">
                      {/* Photoshoot Tab */}
                      {getExpandedTab(cat._id, items) === 'photoshoot' && items.photoshoot?.length > 0 && (
                        <div className="showcase-section">
                          <div className="showcase-scroll">
                            {items.photoshoot.map((ps, i) => (
                              <div key={i} className="img-row">
                                {renderImageCard(ps.before_url, `Before ${i + 1}`)}
                                {renderImageCard(ps.after_url, `After ${i + 1}`)}
                              </div>
                            ))}
                          </div>
                          {cat.prompts?.shoot && (
                            <div className="prompt-preview-box" onClick={() => togglePrompt(cat._id, 'shoot')}>
                              <div className="prompt-preview-header">
                                <span className="section-title-small">Shoot Prompt</span>
                                {expandedPrompts.has(`${cat._id}_shoot`) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              <p className={`prompt-preview-text ${expandedPrompts.has(`${cat._id}_shoot`) ? 'expanded' : ''}`}>
                                {cat.prompts.shoot}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Catalogue Tab */}
                      {getExpandedTab(cat._id, items) === 'catalogue' && items.catalogue?.length > 0 && (
                        <div className="showcase-section">
                          <div className="showcase-scroll">
                            {items.catalogue.map((cr, i) => (
                              <div key={i} className="img-row">
                                {cr.thumbnails?.map((thumb, idx) => (
                                  <div key={idx}>
                                    {renderImageCard(thumb.image_url, thumb.label || `T${idx + 1}`)}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                          {cat.prompts?.catalogue && (
                            <div className="prompt-preview-box" onClick={() => togglePrompt(cat._id, 'catalogue')}>
                              <div className="prompt-preview-header">
                                <span className="section-title-small">Catalogue Prompt</span>
                                {expandedPrompts.has(`${cat._id}_catalogue`) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              <p className={`prompt-preview-text ${expandedPrompts.has(`${cat._id}_catalogue`) ? 'expanded' : ''}`}>
                                {cat.prompts.catalogue}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Branding Tab */}
                      {getExpandedTab(cat._id, items) === 'branding' && items.branding?.length > 0 && (
                        <div className="showcase-section">
                          <div className="showcase-scroll">
                            {items.branding.map((br, i) => (
                              <div key={i} className="img-row">
                                {renderImageCard(br.before_url, `Before ${i + 1}`)}
                                {renderImageCard(br.after_url, `After ${i + 1}`)}
                              </div>
                            ))}
                          </div>
                          {cat.prompts?.branding && (
                            <div className="prompt-preview-box" onClick={() => togglePrompt(cat._id, 'branding')}>
                              <div className="prompt-preview-header">
                                <span className="section-title-small">Branding Prompt</span>
                                {expandedPrompts.has(`${cat._id}_branding`) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              <p className={`prompt-preview-text ${expandedPrompts.has(`${cat._id}_branding`) ? 'expanded' : ''}`}>
                                {cat.prompts.branding}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Edit/Add Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} title={editingId ? 'Edit Category' : 'Add Category'} size="xl">
        <div className="category-form">
          {/* Tabs */}
          <div className="tabs-container">
            <button className={`tab ${activeTab === 'basic' ? 'tab-active' : ''}`} onClick={() => setActiveTab('basic')}>
              Basic Info
            </button>
            <button className={`tab ${activeTab === 'photoshoot' ? 'tab-active' : ''}`} onClick={() => setActiveTab('photoshoot')}>
              Photoshoot
            </button>
            <button className={`tab ${activeTab === 'catalogue' ? 'tab-active' : ''}`} onClick={() => setActiveTab('catalogue')}>
              Catalogue
            </button>
            <button className={`tab ${activeTab === 'branding' ? 'tab-active' : ''}`} onClick={() => setActiveTab('branding')}>
              Branding
            </button>
          </div>

          <div className="form-scroll">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="tab-content">
                <h3 className="form-section-title">Basic Information</h3>
                <input className="form-input" placeholder="Category ID (e.g. jewelry)" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
                <input className="form-input" placeholder="Title (e.g. Jewelry)" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="form-input" placeholder="Icon Name (e.g. IoDiamond, IoShirt, IoWatch)" value={icon} onChange={(e) => setIcon(e.target.value)} />
                <div className="icon-preview">
                  <span>Preview: </span>
                  <div className="cat-icon-circle">{renderIcon(icon)}</div>
                </div>
                <input className="form-input" type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} />
                
                <div className="form-toggle-container">
                  <div className="form-toggle-label">
                    <Power size={18} />
                    <span>Category Status</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className={`toggle-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="form-hint">Inactive categories will not be visible to users in the app</p>
                
                <p className="form-hint">Common icons: IoDiamond, IoShirt, IoWatch, IoRibbon, IoBag, IoGlasses, IoFootball, IoCar</p>
              </div>
            )}

            {/* Photoshoot Tab */}
            {activeTab === 'photoshoot' && (
              <div className="tab-content">
                <h3 className="form-section-title">Photoshoot Prompt</h3>
                <textarea rows={prompt_rows} className="form-textarea" placeholder="Custom prompt for photoshoot subcategory..." value={shootPrompt} onChange={(e) => setShootPrompt(e.target.value)} />
                
                <div className="array-header">
                  <h3 className="form-section-title">Showcase Items</h3>
                  <button className="add-item-btn" onClick={() => setPhotoshoots([...photoshoots, { id: '', before_url: '', after_url: '' }])}>
                    + Add Item
                  </button>
                </div>
                {photoshoots.map((ps, idx) => (
                  <div key={idx} className="dynamic-block">
                    <div className="dynamic-block-header">
                      <span>Item {idx + 1}</span>
                      <button onClick={() => { const p = [...photoshoots]; p.splice(idx, 1); setPhotoshoots(p); }}>
                        <Trash2 size={18} color="var(--color-error)" />
                      </button>
                    </div>
                    <input className="form-input-small" placeholder="Item ID (e.g. ps1)" value={ps.id} onChange={(e) => { const p = [...photoshoots]; p[idx].id = e.target.value; setPhotoshoots(p); }} />
                    <div className="upload-row">
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const p = [...photoshoots];
                            p[idx].before_url = url;
                            setPhotoshoots(p);
                          }
                        }} style={{ display: 'none' }} id={`ps-before-${idx}`} />
                        <label htmlFor={`ps-before-${idx}`} className="upload-label">
                          {ps.before_url ? <img src={getFullUrl(ps.before_url)} alt="Before" className="upload-img" /> : <ImageIcon size={24} />}
                          <span>Before</span>
                        </label>
                      </div>
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const p = [...photoshoots];
                            p[idx].after_url = url;
                            setPhotoshoots(p);
                          }
                        }} style={{ display: 'none' }} id={`ps-after-${idx}`} />
                        <label htmlFor={`ps-after-${idx}`} className="upload-label">
                          {ps.after_url ? <img src={getFullUrl(ps.after_url)} alt="After" className="upload-img" /> : <ImageIcon size={24} />}
                          <span>After</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="tab-content">
                <h3 className="form-section-title">Branding Prompt</h3>
                <textarea  rows={prompt_rows} className="form-textarea" placeholder="Custom prompt for branding subcategory..." value={brandingPrompt} onChange={(e) => setBrandingPrompt(e.target.value)} />
                
                <div className="array-header">
                  <h3 className="form-section-title">Showcase Items</h3>
                  <button className="add-item-btn" onClick={() => setBrandings([...brandings, { id: '', before_url: '', after_url: '' }])}>
                    + Add Item
                  </button>
                </div>
                {brandings.map((br, idx) => (
                  <div key={idx} className="dynamic-block">
                    <div className="dynamic-block-header">
                      <span>Item {idx + 1}</span>
                      <button onClick={() => { const b = [...brandings]; b.splice(idx, 1); setBrandings(b); }}>
                        <Trash2 size={18} color="var(--color-error)" />
                      </button>
                    </div>
                    <input className="form-input-small" placeholder="Item ID (e.g. br1)" value={br.id} onChange={(e) => { const b = [...brandings]; b[idx].id = e.target.value; setBrandings(b); }} />
                    <div className="upload-row">
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const b = [...brandings];
                            b[idx].before_url = url;
                            setBrandings(b);
                          }
                        }} style={{ display: 'none' }} id={`br-before-${idx}`} />
                        <label htmlFor={`br-before-${idx}`} className="upload-label">
                          {br.before_url ? <img src={getFullUrl(br.before_url)} alt="Before" className="upload-img" /> : <ImageIcon size={24} />}
                          <span>Before</span>
                        </label>
                      </div>
                      <div className="upload-box">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleImageUpload(file);
                            const b = [...brandings];
                            b[idx].after_url = url;
                            setBrandings(b);
                          }
                        }} style={{ display: 'none' }} id={`br-after-${idx}`} />
                        <label htmlFor={`br-after-${idx}`} className="upload-label">
                          {br.after_url ? <img src={getFullUrl(br.after_url)} alt="After" className="upload-img" /> : <ImageIcon size={24} />}
                          <span>After</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Catalogue Tab */}
            {activeTab === 'catalogue' && (
              <div className="tab-content">
                <h3 className="form-section-title">Catalogue Prompt</h3>
                <textarea rows={prompt_rows} className="form-textarea" placeholder="Custom prompt for catalogue subcategory..." value={cataloguePrompt} onChange={(e) => setCataloguePrompt(e.target.value)} />
                
                <div className="array-header">
                  <h3 className="form-section-title">Catalogue Sets (5 Thumbnails)</h3>
                  <button className="add-item-btn" onClick={() => setCatalogues([...catalogues, { id: '', thumbnails: ['', '', '', '', ''] }])}>
                    + Add Set
                  </button>
                </div>
                {catalogues.map((cat, idx) => (
                  <div key={idx} className="dynamic-block">
                    <div className="dynamic-block-header">
                      <span>Set {idx + 1}</span>
                      <button onClick={() => { const c = [...catalogues]; c.splice(idx, 1); setCatalogues(c); }}>
                        <Trash2 size={18} color="var(--color-error)" />
                      </button>
                    </div>
                    <input className="form-input-small" placeholder="Set ID (e.g. cat1)" value={cat.id} onChange={(e) => { const c = [...catalogues]; c[idx].id = e.target.value; setCatalogues(c); }} />
                    <div className="upload-row-scroll">
                      {cat.thumbnails.map((img, tIdx) => (
                        <div key={tIdx} className="upload-box">
                          <input type="file" accept="image/*" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await handleImageUpload(file);
                              const c = [...catalogues];
                              c[idx].thumbnails[tIdx] = url;
                              setCatalogues(c);
                            }
                          }} style={{ display: 'none' }} id={`cat-${idx}-${tIdx}`} />
                          <label htmlFor={`cat-${idx}-${tIdx}`} className="upload-label">
                            {img ? <img src={getFullUrl(img)} alt={CAT_LABELS[tIdx]} className="upload-img" /> : <ImageIcon size={24} />}
                            <span>{CAT_LABELS[tIdx]}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="primary" fullWidth loading={saving} onClick={handleSave} style={{ marginTop: '16px' }}>
            Save Category
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
