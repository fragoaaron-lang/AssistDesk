import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import HeaderProfile from './HeaderProfile';
import LogoutButton from './LogoutButton';
import SidebarProfile from './SidebarProfile';

function AdminCatalogPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '', map_x: '', map_y: '' });
  const [serviceForm, setServiceForm] = useState({ department_id: '', name: '', requirements: '', processing_time: '' });
  const [faqForm, setFaqForm] = useState({ department_id: '', question: '', answer: '', keywords: '' });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [message, setMessage] = useState('');

  const groupedFaqs = Object.values(faqs.reduce((groups, faq) => {
    const departmentId = faq.department_id || 'unassigned';
    const departmentName = faq.Department?.name || 'Unassigned Department';
    if (!groups[departmentId]) groups[departmentId] = { name: departmentName, faqs: [] };
    groups[departmentId].faqs.push(faq);
    return groups;
  }, {})).sort((first, second) => first.name.localeCompare(second.name));
  const isDepartmentScopedAdmin = user?.role === 'admin' && Number(user.department_id) > 0;

  const api = axios.create({
    baseURL: `${API_BASE_URL}/api/catalog`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadData = async () => {
    const [deptRes, serviceRes, faqRes] = await Promise.all([
      api.get('/departments/manage'),
      api.get('/services'),
      api.get('/faqs'),
    ]);
    setDepartments(deptRes.data.departments || []);
    setServices(serviceRes.data.services || []);
    setFaqs(faqRes.data.faqs || []);
  };

  useEffect(() => {
    if (token) {
      loadData().catch(() => setMessage('Failed to load admin catalog data.'));
    }
  }, [token]);

  const createDepartment = async (e) => {
    e.preventDefault();
    if (editingDepartmentId) await api.put(`/departments/${editingDepartmentId}`, departmentForm);
    else await api.post('/departments', departmentForm);
    setEditingDepartmentId(null);
    setDepartmentForm({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '', map_x: '', map_y: '' });
    loadData();
  };

  const createService = async (e) => {
    e.preventDefault();
    const payload = isDepartmentScopedAdmin ? { ...serviceForm, department_id: String(user.department_id) } : serviceForm;
    if (editingServiceId) await api.put(`/services/${editingServiceId}`, payload);
    else await api.post('/services', payload);
    setEditingServiceId(null);
    setServiceForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', name: '', requirements: '', processing_time: '' });
    loadData();
  };

  const createFaq = async (e) => {
    e.preventDefault();
    const payload = isDepartmentScopedAdmin ? { ...faqForm, department_id: String(user.department_id) } : faqForm;
    if (editingFaqId) await api.put(`/faqs/${editingFaqId}`, payload);
    else await api.post('/faqs', payload);
    setEditingFaqId(null);
    setFaqForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', question: '', answer: '', keywords: '' });
    loadData();
  };

  const deleteCatalogItem = async (kind, id, label) => {
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      await api.delete(`/${kind}/${id}`);
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || `Unable to delete ${label}.`);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-shell">
        <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />
        <header className="page-header">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            ☰
          </button>
          <button type="button" className="header-brand header-brand-button" onClick={() => window.location.reload()} aria-label="Refresh AssistDesk">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Admin catalog management</p>
            </div>
          </button>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/tickets">Tickets</a>
            <a href="/profile">Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/catalog">Catalog</a>
                <a href="/admin/reports">Data Analytics</a>
                <a href="/admin/reports?view=users" className="header-nav-button">Users</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <HeaderProfile user={user} />
            <LogoutButton />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          </div>
          <div className="mobile-profile-summary">
            <SidebarProfile user={user} />
          </div>
          <div className="nav-links">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Data Analytics</a>
                <a href="/admin/reports?view=users" className="header-nav-button" onClick={() => setMobileMenuOpen(false)}>Users</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>Catalog administration</h2>
            <p>Maintain departments, services, and FAQs from one institutional workspace.</p>
          </div>
        </div>

        {message && <p>{message}</p>}

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <h3>{editingDepartmentId ? 'Edit Department' : (user?.role === 'admin' && user?.department_id ? 'Your Department' : 'Add Department')}</h3>
          {(!user?.department_id || editingDepartmentId) && <form onSubmit={createDepartment}>
            <input className="institutional-input" placeholder="Name" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
            <input className="institutional-input" placeholder="Description" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} />
            <input className="institutional-input" placeholder="Point Person" value={departmentForm.point_person} onChange={(e) => setDepartmentForm({ ...departmentForm, point_person: e.target.value })} />
            <input className="institutional-input" placeholder="Contact Number" value={departmentForm.contact_number} onChange={(e) => setDepartmentForm({ ...departmentForm, contact_number: e.target.value })} />
            <input className="institutional-input" placeholder="Location" value={departmentForm.location} onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })} />
            <input className="institutional-input" placeholder="Office Hours" value={departmentForm.office_hours} onChange={(e) => setDepartmentForm({ ...departmentForm, office_hours: e.target.value })} />
            <button className="institutional-btn" type="submit">{editingDepartmentId ? 'Update Department' : 'Save Department'}</button>
            <div className="department-map-coordinate-fields">
              <label>Map X (%)<input className="institutional-input" type="number" min="0" max="100" step="0.1" placeholder="0–100 from left" value={departmentForm.map_x} onChange={(e) => setDepartmentForm({ ...departmentForm, map_x: e.target.value })} /></label>
              <label>Map Y (%)<input className="institutional-input" type="number" min="0" max="100" step="0.1" placeholder="0–100 from top" value={departmentForm.map_y} onChange={(e) => setDepartmentForm({ ...departmentForm, map_y: e.target.value })} /></label>
              <small>Coordinates are percentages of the bundled campus map image. Leave blank to hide this office marker.</small>
            </div>
            {editingDepartmentId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingDepartmentId(null); setDepartmentForm({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '', map_x: '', map_y: '' }); }}>Cancel edit</button>}
          </form>}
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {departments.map((dept) => <div className="inline-actions" key={dept.id}>
              <span>{dept.name} — {dept.point_person || 'No point person'}</span>
              <span className="small-muted">{dept.map_x == null || dept.map_y == null ? 'Map marker not set' : `Map: ${Number(dept.map_x).toFixed(1)}%, ${Number(dept.map_y).toFixed(1)}%`}</span>
              <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingDepartmentId(dept.id); setDepartmentForm({ name: dept.name || '', description: dept.description || '', point_person: dept.point_person || '', contact_number: dept.contact_number || '', location: dept.location || '', office_hours: dept.office_hours || '', map_x: dept.map_x ?? '', map_y: dept.map_y ?? '' }); }}>Edit</button>
              <button className="institutional-btn small danger" type="button" onClick={() => deleteCatalogItem('departments', dept.id, dept.name)}>Delete</button>
            </div>)}
          </div>
        </div>

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <h3>{editingServiceId ? 'Edit Service' : 'Add Service'}</h3>
          <form onSubmit={createService}>
            {isDepartmentScopedAdmin ? (
              <input className="institutional-input" value={serviceForm.department_id || user.department_id || ''} readOnly />
            ) : (
              <select className="institutional-select" value={serviceForm.department_id} onChange={(e) => setServiceForm({ ...serviceForm, department_id: e.target.value })} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                ))}
              </select>
            )}
            <input className="institutional-input" placeholder="Service Name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
            <input className="institutional-input" placeholder="Requirements" value={serviceForm.requirements} onChange={(e) => setServiceForm({ ...serviceForm, requirements: e.target.value })} />
            <input className="institutional-input" placeholder="Processing Time" value={serviceForm.processing_time} onChange={(e) => setServiceForm({ ...serviceForm, processing_time: e.target.value })} />
            <button className="institutional-btn" type="submit">{editingServiceId ? 'Update Service' : 'Save Service'}</button>
            {editingServiceId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingServiceId(null); setServiceForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', name: '', requirements: '', processing_time: '' }); }}>Cancel edit</button>}
          </form>
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {services.map((service) => <div className="inline-actions" key={service.id}>
              <span>{service.name} — {service.Department?.name || 'Department unavailable'}</span>
              <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingServiceId(service.id); setServiceForm({ department_id: String(service.department_id), name: service.name || '', requirements: service.requirements || '', processing_time: service.processing_time || '' }); }}>Edit</button>
              <button className="institutional-btn small danger" type="button" onClick={() => deleteCatalogItem('services', service.id, service.name)}>Delete</button>
            </div>)}
          </div>
        </div>

        <div className="institutional-card">
          <h3>{editingFaqId ? 'Edit FAQ' : 'Add FAQ'}</h3>
          <form onSubmit={createFaq}>
            {isDepartmentScopedAdmin ? (
              <input className="institutional-input" value={faqForm.department_id || user.department_id || ''} readOnly />
            ) : (
              <select className="institutional-select" value={faqForm.department_id} onChange={(e) => setFaqForm({ ...faqForm, department_id: e.target.value })} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                ))}
              </select>
            )}
            <input className="institutional-input" placeholder="Question" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} required />
            <input className="institutional-input" placeholder="Answer" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} required />
            <input className="institutional-input" placeholder="Keywords" value={faqForm.keywords} onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })} />
            <button className="institutional-btn" type="submit">{editingFaqId ? 'Update FAQ' : 'Save FAQ'}</button>
            {editingFaqId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingFaqId(null); setFaqForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', question: '', answer: '', keywords: '' }); }}>Cancel edit</button>}
          </form>
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {groupedFaqs.map((group) => (
              <details key={group.name} className="catalog-faq-folder">
                <summary>
                  <span className="ticket-folder-icon" aria-hidden="true" />
                  <span>{group.name}</span>
                  <span className="ticket-department-count">{group.faqs.length}</span>
                </summary>
                <div className="catalog-faq-folder-content">
                  {group.faqs.map((faq) => (
                    <div key={faq.id} className="catalog-faq-item">
                      <strong>{faq.question}</strong>
                      <p>{faq.answer}</p>
                      <p><small>Routing keywords: {faq.keywords || 'None'}</small></p>
                      <div className="inline-actions">
                        <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingFaqId(faq.id); setFaqForm({ department_id: String(faq.department_id), question: faq.question || '', answer: faq.answer || '', keywords: faq.keywords || '' }); }}>Edit FAQ / routing keywords</button>
                        <button className="institutional-btn small danger" type="button" onClick={() => deleteCatalogItem('faqs', faq.id, faq.question)}>Delete FAQ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCatalogPage;
