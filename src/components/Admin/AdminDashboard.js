import React, { useState, useEffect, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Container, Row, Col, Form, Spinner, Alert } from "react-bootstrap";
import { PortfolioContext } from "../../context/PortfolioContext";
import axios from "axios";
import { FaUserCircle, FaProjectDiagram, FaCog, FaCheckCircle, FaTrash, FaPlus, FaSignOutAlt } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import "./AdminDashboard.css";

const AUTHORIZED_EMAIL = "gouthamkishore.k@gmail.com";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const AdminDashboard = () => {
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const { data, refreshData, updateData } = useContext(PortfolioContext);
  
  const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("profiles");
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [pullingFromMongo, setPullingFromMongo] = useState(false);

  useEffect(() => {
    if (data) {
      const copy = JSON.parse(JSON.stringify(data));
      copy.chatbot = copy.chatbot || {
        model: DEFAULT_MODEL
      };
      // Ensure all profiles have systemPrompt and resumeText fields
      copy.profiles = copy.profiles.map(p => ({
        ...p,
        systemPrompt: p.systemPrompt || "You are an AI assistant. Answer questions helpfully and professionally. Be concise and default to 80-120 words unless asked for more detail.",
        resumeText: p.resumeText || ""
      }));
      setFormData(copy);
      if (!editingProfileId && copy.profiles?.length > 0) {
        setEditingProfileId(copy.profiles[0].id);
      }
    }
  }, [data, editingProfileId]);

  const refreshModels = async () => {
    if (modelsLoading) return;
    setModelsLoading(true);
    setMessage(null);
    try {
      let models = [];
      const isFreeModel = (model) => {
        const promptPrice = Number(model?.pricing?.prompt);
        const completionPrice = Number(model?.pricing?.completion);
        return Number.isFinite(promptPrice) && Number.isFinite(completionPrice) && promptPrice === 0 && completionPrice === 0;
      };

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/models`,
          {}
        );
        models = res.data?.models || [];
      } catch (error) {
        const status = error?.response?.status;
        if (status !== 404) {
          throw error;
        }

        try {
          const res = await axios.post("/api/models", {});
          models = res.data?.models || [];
        } catch (fallbackError) {
          const fallbackStatus = fallbackError?.response?.status;
          if (fallbackStatus !== 404) {
            throw fallbackError;
          }

          const publicRes = await axios.get("https://openrouter.ai/api/v1/models");
          models = Array.isArray(publicRes.data?.data)
            ? publicRes.data.data
                .map((model) => ({ id: model.id, name: model.name || model.id, pricing: model.pricing }))
                .filter((model) => model.id && isFreeModel(model))
                .sort((a, b) => a.id.localeCompare(b.id))
            : [];
        }
      }

      setAvailableModels(models);
      setMessage({ type: 'success', text: `Loaded ${models.length} models.` });
      if (models.length > 0 && !models.some((m) => m.id === formData?.chatbot?.model)) {
        setFormData((prev) => ({
          ...prev,
          chatbot: {
            ...prev.chatbot,
            model: models[0].id
          }
        }));
      }
    } catch (error) {
      console.error("Model refresh error", error);
      const errorText = error?.response?.data?.error || error?.message || "Failed to refresh model list. If you are running locally, restart the backend server.";
      setMessage({ type: 'danger', text: errorText });
    } finally {
      setModelsLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  useEffect(() => {
    if (activeTab === "global" && availableModels.length === 0 && formData?.chatbot) {
      refreshModels();
    }
  }, [activeTab, availableModels, formData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.email !== AUTHORIZED_EMAIL) {
    return (
      <Container className="admin-dashboard-container access-denied">
        <MdAdminPanelSettings className="access-denied-icon" />
        <h2 style={{color: 'white', fontWeight: 700}}>Access Denied</h2>
        <p style={{color: '#8b949e', maxWidth: '400px'}}>
          You are logged in as {user?.email}, but you do not have administrative privileges for this portfolio.
        </p>
        <button className="admin-btn-outline mt-4" onClick={() => logout({ returnTo: window.location.origin })}>
          Sign Out
        </button>
      </Container>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_BASE_URL}/api/portfolio`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Data saved successfully!' });
      const returned = res.data?.data;
      if (returned && typeof updateData === 'function') {
        updateData(returned);
      } else {
        refreshData();
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'danger', text: 'Failed to save data. Check console.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handlePullFromMongo = async () => {
    if (pullingFromMongo) return;

    setPullingFromMongo(true);
    setMessage(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_BASE_URL}/api/portfolio/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const returned = res.data?.data;
      if (returned && typeof updateData === 'function') {
        updateData(returned);
      }

      setFormData((prev) => {
        if (!prev) return prev;
        return returned ? JSON.parse(JSON.stringify(returned)) : prev;
      });

      setMessage({ type: 'success', text: 'Pulled latest portfolio data from MongoDB.' });
    } catch (error) {
      console.error('Mongo pull error', error);
      const errorText = error?.response?.data?.error || error?.message || 'Failed to pull portfolio data from MongoDB.';
      setMessage({ type: 'danger', text: errorText });
    } finally {
      setPullingFromMongo(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleFileUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = await getAccessTokenSilently();
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const res = await axios.post(`${API_BASE_URL}/api/upload`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      callback(res.data.url);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
    } catch (error) {
      console.error("Upload error", error);
      setMessage({ type: 'danger', text: 'Upload failed.' });
    }
  };

  const handleParseResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsingResume(true);
    setMessage(null);
    try {
      const token = await getAccessTokenSilently();
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const res = await axios.post(`${API_BASE_URL}/api/parse-resume`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { parsedData, url, resumeText } = res.data;
      if (!parsedData) {
        setMessage({ type: 'danger', text: res.data.error || 'Failed to parse resume.' });
        return;
      }

      // Auto-populate profile fields - batch all updates into one state change
      const activeIdx = formData.profiles.findIndex(p => p.id === editingProfileId);
      if (activeIdx >= 0) {
        const newProfiles = [...formData.profiles];
        const updated = { ...newProfiles[activeIdx] };
        
        updated.resumeUrl = url;
        if (resumeText) {
          updated.resumeText = resumeText;
        }
        if (parsedData.profileName) {
          updated.name = parsedData.profileName;
        }
        if (parsedData.roles && Array.isArray(parsedData.roles)) {
          updated.roles = parsedData.roles;
        }
        if (parsedData.experienceBio) {
          updated.experienceBio = parsedData.experienceBio;
        }
        if (parsedData.projects && Array.isArray(parsedData.projects)) {
          updated.projects = parsedData.projects;
        }
        
        newProfiles[activeIdx] = updated;
        setFormData({ ...formData, profiles: newProfiles });
        setMessage({ type: 'success', text: 'Resume parsed successfully! Profile fields updated.' });
      } else {
        setMessage({ type: 'danger', text: 'No profile selected for updating.' });
      }
    } catch (error) {
      console.error("Resume parse error", error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to parse resume.';
      setMessage({ type: 'danger', text: errorMsg });
    } finally {
      setParsingResume(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const addProfile = () => {
    const newId = `profile-${Date.now()}`;
    setFormData({
      ...formData,
      profiles: [...formData.profiles, {
        id: newId,
        name: "New Profile",
        roles: [""],
        avatarUrl: "",
        resumeUrl: "",
        experienceBio: "",
        projects: [],
        systemPrompt: "You are an AI assistant. Answer questions helpfully and professionally. Be concise and default to 80-120 words unless asked for more detail.",
        resumeText: ""
      }]
    });
    setEditingProfileId(newId);
    setActiveTab("edit-profile");
  };

  const deleteProfile = (id) => {
    if (formData.profiles.length <= 1) {
      alert("You must have at least one profile.");
      return;
    }
    const updated = formData.profiles.filter(p => p.id !== id);
    let newActiveId = formData.activeProfileId;
    if (newActiveId === id) newActiveId = updated[0].id;
    
    setFormData({
      ...formData,
      profiles: updated,
      activeProfileId: newActiveId
    });
    if (editingProfileId === id) setEditingProfileId(updated[0].id);
  };

  if (!formData) return <Container className="mt-5 text-center"><Spinner animation="border" variant="light"/></Container>;

  const activeProfileIndex = formData.profiles.findIndex(p => p.id === editingProfileId);
  const editingProfile = formData.profiles[activeProfileIndex];

  const updateEditingProfile = (key, value) => {
    const newProfiles = [...formData.profiles];
    newProfiles[activeProfileIndex] = { ...newProfiles[activeProfileIndex], [key]: value };
    setFormData({ ...formData, profiles: newProfiles });
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Command Center</h1>
          <p style={{ color: '#8b949e', margin: 0 }}>Logged in as {user.email}</p>
        </div>
        <div className="d-flex gap-3">
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Save Changes"}
          </button>
          <button className="admin-btn-outline" onClick={() => logout({ returnTo: window.location.origin })}>
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {message && <Alert variant={message.type} className="mb-4">{message.text}</Alert>}

      <Row>
        <Col md={3}>
          <div className="admin-glass-card p-3 admin-sidebar">
            <button className={`admin-nav-item ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
              <FaUserCircle className="me-2" /> Profile Manager
            </button>
            {editingProfile && (
              <button className={`admin-nav-item ${activeTab === 'edit-profile' ? 'active' : ''}`} onClick={() => setActiveTab('edit-profile')}>
                <FaProjectDiagram className="me-2" /> Edit: {editingProfile.name}
              </button>
            )}
            <button className={`admin-nav-item ${activeTab === 'global' ? 'active' : ''}`} onClick={() => setActiveTab('global')}>
              <FaCog className="me-2" /> Global Settings
            </button>
          </div>
        </Col>

        <Col md={9}>
          <div className="admin-glass-card">
            
            {/* PROFILES MANAGER TAB */}
            {activeTab === 'profiles' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 style={{color: 'white', margin: 0}}>Manage Profiles</h3>
                  <button className="admin-btn-primary" onClick={addProfile}><FaPlus /> New Profile</button>
                </div>
                
                {formData.profiles.map(p => (
                  <div key={p.id} className={`profile-card ${formData.activeProfileId === p.id ? 'active-profile' : ''}`}>
                    <div>
                      <h4 style={{color: 'white', margin: 0}}>
                        {p.name} 
                        {formData.activeProfileId === p.id && <span className="badge bg-primary ms-2">Active</span>}
                      </h4>
                      <p style={{color: '#8b949e', margin: 0, fontSize: '0.9rem'}}>{p.roles.join(', ')}</p>
                    </div>
                    <div className="d-flex gap-2">
                      {formData.activeProfileId !== p.id && (
                        <button className="admin-btn-outline" onClick={() => setFormData({...formData, activeProfileId: p.id})}>
                          <FaCheckCircle className="me-1"/> Set Active
                        </button>
                      )}
                      <button className="admin-btn-outline" onClick={() => { setEditingProfileId(p.id); setActiveTab('edit-profile'); }}>
                        Edit
                      </button>
                      <button className="admin-btn-outline text-danger border-danger" onClick={() => deleteProfile(p.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EDIT PROFILE TAB */}
            {activeTab === 'edit-profile' && editingProfile && (
              <div>
                <h3 style={{color: 'white', marginBottom: '20px'}}>Editing Profile: {editingProfile.name}</h3>
                
                <Form.Group className="mb-4">
                  <Form.Label className="admin-label">Profile Identifier Name</Form.Label>
                  <Form.Control className="admin-input" value={editingProfile.name} onChange={(e) => updateEditingProfile('name', e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="admin-label">Roles (comma separated)</Form.Label>
                  <Form.Control className="admin-input" value={editingProfile.roles.join(', ')} onChange={(e) => updateEditingProfile('roles', e.target.value.split(',').map(s=>s.trim()))} />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="admin-label">Avatar URL</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control className="admin-input" value={editingProfile.avatarUrl} onChange={(e) => updateEditingProfile('avatarUrl', e.target.value)} />
                        <Form.Control type="file" className="admin-input" style={{width: '120px'}} onChange={(e) => handleFileUpload(e, (url) => updateEditingProfile('avatarUrl', url))} />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="admin-label">Resume PDF URL</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control className="admin-input" value={editingProfile.resumeUrl} onChange={(e) => updateEditingProfile('resumeUrl', e.target.value)} />
                        <Form.Control type="file" accept="application/pdf" className="admin-input" style={{width: '120px'}} onChange={(e) => handleFileUpload(e, (url) => updateEditingProfile('resumeUrl', url))} />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}}/>

                <div className="mb-4">
                  <h5 style={{color: '#c770f0', marginBottom: '15px'}}>Auto-Parse Resume</h5>
                  <p style={{color: '#8b949e', fontSize: '0.9rem', marginBottom: '10px'}}>Upload a resume PDF to automatically extract roles, experience bio, and projects into this profile.</p>
                  <Form.Group>
                    <Form.Label className="admin-label">Upload Resume for Parsing</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control type="file" accept="application/pdf" className="admin-input" onChange={handleParseResume} disabled={parsingResume} />
                      {parsingResume && <Spinner animation="border" variant="light" size="sm" style={{marginTop: '10px'}} />}
                    </div>
                  </Form.Group>
                </div>

                <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}}/>

                <Form.Group className="mb-4">
                  <Form.Label className="admin-label">Experience Bio (HTML allowed)</Form.Label>
                  <Form.Control as="textarea" rows={5} className="admin-input" value={editingProfile.experienceBio} onChange={(e) => updateEditingProfile('experienceBio', e.target.value)} />
                </Form.Group>

                <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}}/>

                <Form.Group className="mb-4">
                  <Form.Label className="admin-label">AI Chatbot System Prompt</Form.Label>
                  <p style={{color: '#8b949e', fontSize: '0.9rem', marginBottom: '10px'}}>Define the AI personality and guardrails for this profile's chatbot. This prompt will guide how the AI responds to user questions.</p>
                  <Form.Control as="textarea" rows={5} className="admin-input" value={editingProfile.systemPrompt || ''} onChange={(e) => updateEditingProfile('systemPrompt', e.target.value)} placeholder="You are an AI assistant for [Profile Name]. Answer questions about..." />
                </Form.Group>

                <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}}/>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 style={{color: 'white', margin: 0}}>Projects for this Profile</h4>
                  <button className="admin-btn-outline" onClick={() => updateEditingProfile('projects', [...editingProfile.projects, { title: "New Project", description: "", imgPath: "", isWork: false }])}>
                    <FaPlus /> Add Project
                  </button>
                </div>

                {editingProfile.projects.map((proj, idx) => (
                  <div key={idx} className="p-3 mb-3" style={{background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label className="admin-label">Title</Form.Label><Form.Control className="admin-input" value={proj.title} onChange={(e) => { const newP = [...editingProfile.projects]; newP[idx].title = e.target.value; updateEditingProfile('projects', newP); }}/></Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label className="admin-label">Image URL</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control className="admin-input" value={proj.imgPath} onChange={(e) => { const newP = [...editingProfile.projects]; newP[idx].imgPath = e.target.value; updateEditingProfile('projects', newP); }}/>
                            <Form.Control type="file" className="admin-input" style={{width: '90px'}} onChange={(e) => handleFileUpload(e, (url) => { const newP = [...editingProfile.projects]; newP[idx].imgPath = url; updateEditingProfile('projects', newP); })} />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label className="admin-label">Description</Form.Label><Form.Control as="textarea" rows={4} className="admin-input" value={proj.description} onChange={(e) => { const newP = [...editingProfile.projects]; newP[idx].description = e.target.value; updateEditingProfile('projects', newP); }}/></Form.Group>
                        <button className="admin-btn-outline text-danger border-danger w-100" onClick={() => { const newP = editingProfile.projects.filter((_, i) => i !== idx); updateEditingProfile('projects', newP); }}><FaTrash /> Remove Project</button>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}

            {/* GLOBAL SETTINGS TAB */}
            {activeTab === 'global' && (
              <div>
                <h3 style={{color: 'white', marginBottom: '20px'}}>Global Settings</h3>
                <div className="d-flex justify-content-end mb-3">
                  <button className="admin-btn-outline" onClick={handlePullFromMongo} disabled={pullingFromMongo}>
                    {pullingFromMongo ? 'Pulling from Mongo...' : 'Pull portfolio_data from Mongo'}
                  </button>
                </div>
                
                <h5 style={{color: '#c770f0', marginTop: '20px'}}>Menu Visibility</h5>
                <Row className="mb-4">
                  {Object.keys(formData.menuVisibility).map(key => (
                    <Col md={3} key={key}>
                      <Form.Check 
                        type="switch"
                        id={`nav-${key}`}
                        label={key}
                        checked={formData.menuVisibility[key]}
                        onChange={(e) => setFormData({...formData, menuVisibility: {...formData.menuVisibility, [key]: e.target.checked}})}
                      />
                    </Col>
                  ))}
                </Row>

                <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}}/>

                <h5 style={{color: '#c770f0'}}>Chatbot Configuration</h5>
                <p style={{color: '#8b949e', fontSize: '0.9rem'}}>API Key is configured via Vercel environment variables.</p>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="admin-label mb-0">Model</Form.Label>
                  <button className="admin-btn-outline" onClick={refreshModels} disabled={modelsLoading}>
                    {modelsLoading ? "Refreshing..." : "Refresh Models"}
                  </button>
                </div>
                <Form.Group className="mb-3">
                  <Form.Select
                    className="admin-input"
                    value={formData.chatbot.model}
                    onChange={(e) => setFormData({...formData, chatbot: {...formData.chatbot, model: e.target.value}})}
                    disabled={modelsLoading || availableModels.length === 0}
                  >
                    {availableModels.length === 0 && <option value="">No models loaded</option>}
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>{model.name} ({model.id})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="admin-label">Custom Model ID (optional override)</Form.Label>
                  <Form.Control type="text" className="admin-input" value={formData.chatbot.model} onChange={(e) => setFormData({...formData, chatbot: {...formData.chatbot, model: e.target.value}})} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="admin-label">System Prompt / Guardrails</Form.Label>
                  <Form.Control as="textarea" rows={6} className="admin-input" value={formData.chatbot.systemPrompt} onChange={(e) => setFormData({...formData, chatbot: {...formData.chatbot, systemPrompt: e.target.value}})} />
                </Form.Group>
              </div>
            )}

          </div>
        </Col>
      </Row>
    </div>
  );
};

const AdminDashboardProtected = () => {
  const { isLoading, isAuthenticated, user, loginWithRedirect } = useAuth0();
  const authConfigured = Boolean(
    process.env.REACT_APP_AUTH0_DOMAIN &&
    process.env.REACT_APP_AUTH0_CLIENT_ID &&
    process.env.REACT_APP_AUTH0_CALLBACK_URL
  );

  if (!authConfigured) {
    return <AdminDashboard />;
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="light" />
        <p style={{ color: '#8b949e', marginTop: '16px' }}>Checking admin session...</p>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="admin-dashboard-container access-denied">
        <MdAdminPanelSettings className="access-denied-icon" />
        <h2 style={{ color: 'white', fontWeight: 700 }}>Access Required</h2>
        <p style={{ color: '#8b949e', maxWidth: '400px' }}>
          You need to sign in to access the admin dashboard.
        </p>
        <button className="admin-btn-outline mt-4" onClick={() => loginWithRedirect({ appState: { returnTo: "/admin" } })}>
          Sign In
        </button>
      </Container>
    );
  }

  if (user?.email !== AUTHORIZED_EMAIL) {
    return (
      <Container className="admin-dashboard-container access-denied">
        <MdAdminPanelSettings className="access-denied-icon" />
        <h2 style={{ color: 'white', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: '#8b949e', maxWidth: '400px' }}>
          You are logged in as {user?.email}, but you do not have administrative privileges for this portfolio.
        </p>
      </Container>
    );
  }

  return <AdminDashboard />;
};

export default AdminDashboardProtected;
