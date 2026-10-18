import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import AuthenticatedNavigation from './AuthenticatedNavigation';

function CatalogPageSkeleton() {
  return (
    <div className="catalog-skeleton-grid" role="status" aria-label="Loading catalog" aria-busy="true">
      <span className="report-skeleton-announcement">Loading departments, services, issue options, and FAQs…</span>
      {[0, 1, 2, 3].map((section) => (
        <section className="institutional-card catalog-section-card catalog-skeleton-card" key={section} aria-hidden="true">
          <span className="surface-skeleton-block catalog-skeleton-title" />
          <span className="surface-skeleton-block catalog-skeleton-copy" />
          <div className="catalog-skeleton-fields">
            {Array.from({ length: section === 0 ? 6 : section === 2 ? 3 : 4 }, (_, index) => (
              <span className="surface-skeleton-block" key={index} />
            ))}
          </div>
          <span className="surface-skeleton-block catalog-skeleton-action" />
          <div className="catalog-skeleton-records">
            {[0, 1, 2].map((row) => <span className="surface-skeleton-block" key={row} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function AdminCatalogPage() {
  const { token, user } = useAuth();
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [issueGroups, setIssueGroups] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '', map_x: '', map_y: '' });
  const [serviceForm, setServiceForm] = useState({ department_id: '', name: '', requirements: '', processing_time: '' });
  const [generalIssueForm, setGeneralIssueForm] = useState({ department_id: '', name: '' });
  const [specificIssueForm, setSpecificIssueForm] = useState({ general_issue_id: '', name: '' });
  const [faqForm, setFaqForm] = useState({ department_id: '', question: '', answer: '', keywords: '' });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingGeneralIssueId, setEditingGeneralIssueId] = useState(null);
  const [editingSpecificIssueId, setEditingSpecificIssueId] = useState(null);
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
  const getDepartmentNameById = (departmentId) => {
    const match = departments.find((department) => Number(department.id) === Number(departmentId));
    return match ? (match.display_name || match.name) : 'Your department';
  };

  const api = axios.create({
    baseURL: `${API_BASE_URL}/api/catalog`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadData = async (showSkeleton = false) => {
    if (showSkeleton) setCatalogLoading(true);
    try {
      const [deptRes, serviceRes, issueRes, faqRes] = await Promise.all([
        api.get('/departments/manage'),
        api.get('/services'),
        api.get('/issues'),
        api.get('/faqs'),
      ]);
      setDepartments(deptRes.data.departments || []);
      setServices(serviceRes.data.services || []);
      setIssueGroups(issueRes.data.generalIssues || []);
      setFaqs(faqRes.data.faqs || []);
    } finally {
      if (showSkeleton) setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(true).catch(() => setMessage('Failed to load admin catalog data.'));
    }
  }, [token]);

  useEffect(() => {
    const refreshCatalog = (event) => {
      if (event.detail?.page !== 'catalog' || !token) return;
      loadData(true).catch(() => setMessage('Failed to load admin catalog data.'));
    };

    window.addEventListener('assistdesk:page-refresh', refreshCatalog);
    return () => window.removeEventListener('assistdesk:page-refresh', refreshCatalog);
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

  const saveGeneralIssue = async (e) => {
    e.preventDefault();
    const payload = isDepartmentScopedAdmin
      ? { ...generalIssueForm, department_id: String(user.department_id) }
      : generalIssueForm;
    try {
      if (editingGeneralIssueId) await api.put(`/issues/${editingGeneralIssueId}`, payload);
      else await api.post('/issues', payload);
      setEditingGeneralIssueId(null);
      setGeneralIssueForm({ department_id: '', name: '' });
      setMessage('General issue saved.');
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save general issue.');
    }
  };

  const saveSpecificIssue = async (e) => {
    e.preventDefault();
    try {
      if (editingSpecificIssueId) await api.put(`/specific-issues/${editingSpecificIssueId}`, { name: specificIssueForm.name });
      else await api.post(`/issues/${specificIssueForm.general_issue_id}/specific`, { name: specificIssueForm.name });
      setEditingSpecificIssueId(null);
      setSpecificIssueForm({ general_issue_id: '', name: '' });
      setMessage('Specific issue saved.');
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save specific issue.');
    }
  };

  const deleteIssueItem = async (path, id, label) => {
    if (!window.confirm(`Delete ${label}?${path === 'issues' ? ' Its specific issues will also be deleted.' : ''}`)) return;
    try {
      await api.delete(`/${path}/${id}`);
      setMessage(`${label} deleted.`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || `Unable to delete ${label}.`);
    }
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
        <AuthenticatedNavigation user={user} subtitle="Admin catalog management" />

        <div className="page-intro">
          <div>
            <h2>Catalog administration</h2>
            <p>Maintain departments, services, and FAQs from one institutional workspace.</p>
          </div>
        </div>

        {message && <p className="catalog-feedback" role="status">{message}</p>}

        {catalogLoading ? <CatalogPageSkeleton /> : <>
        <div className="institutional-card catalog-section-card" style={{ marginBottom: '20px' }}>
          <div className="catalog-section-heading">
            <div>
              <h3>{editingDepartmentId ? 'Edit Department' : (user?.role === 'admin' && user?.department_id ? 'Your Department' : 'Add Department')}</h3>
              <p>Maintain office details and optional map placement for campus support.</p>
            </div>
          </div>
          {(!user?.department_id || editingDepartmentId) && <form className="catalog-form-grid" onSubmit={createDepartment}>
            <label className="catalog-field">Department name<input className="institutional-input" placeholder="e.g. Library Department" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required /></label>
            <label className="catalog-field">Description<input className="institutional-input" placeholder="What this department supports" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} /></label>
            <label className="catalog-field">Point person<input className="institutional-input" placeholder="Office contact name" value={departmentForm.point_person} onChange={(e) => setDepartmentForm({ ...departmentForm, point_person: e.target.value })} /></label>
            <label className="catalog-field">Contact number<input className="institutional-input" type="tel" placeholder="Office phone number" value={departmentForm.contact_number} onChange={(e) => setDepartmentForm({ ...departmentForm, contact_number: e.target.value })} /></label>
            <label className="catalog-field">Office location<input className="institutional-input" placeholder="Building or room" value={departmentForm.location} onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })} /></label>
            <label className="catalog-field">Office hours<input className="institutional-input" placeholder="e.g. Mon–Fri, 8:00 AM–5:00 PM" value={departmentForm.office_hours} onChange={(e) => setDepartmentForm({ ...departmentForm, office_hours: e.target.value })} /></label>
            <button className="institutional-btn" type="submit">{editingDepartmentId ? 'Update Department' : 'Save Department'}</button>
            <div className="department-map-coordinate-fields">
              <label>Map X (%)<input className="institutional-input" type="number" min="0" max="100" step="0.1" placeholder="0–100 from left" value={departmentForm.map_x} onChange={(e) => setDepartmentForm({ ...departmentForm, map_x: e.target.value })} /></label>
              <label>Map Y (%)<input className="institutional-input" type="number" min="0" max="100" step="0.1" placeholder="0–100 from top" value={departmentForm.map_y} onChange={(e) => setDepartmentForm({ ...departmentForm, map_y: e.target.value })} /></label>
              <small>Coordinates are percentages of the bundled campus map image. Leave blank to hide this office marker.</small>
            </div>
            {editingDepartmentId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingDepartmentId(null); setDepartmentForm({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '', map_x: '', map_y: '' }); }}>Cancel edit</button>}
          </form>}
          <div className="catalog-record-list" style={{ marginTop: '12px' }}>
            {departments.length === 0 ? <p className="catalog-empty-state">No departments are available yet.</p> : departments.map((dept) => <div className="catalog-record" key={dept.id}>
              <div className="catalog-record-copy"><strong>{dept.name}</strong><span>{dept.point_person || 'No point person'}</span><small>{dept.map_x == null || dept.map_y == null ? 'Map marker not set' : `Map: ${Number(dept.map_x).toFixed(1)}%, ${Number(dept.map_y).toFixed(1)}%`}</small></div>
              <div className="inline-actions">
                <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingDepartmentId(dept.id); setDepartmentForm({ name: dept.name || '', description: dept.description || '', point_person: dept.point_person || '', contact_number: dept.contact_number || '', location: dept.location || '', office_hours: dept.office_hours || '', map_x: dept.map_x ?? '', map_y: dept.map_y ?? '' }); }}>Edit</button>
                <button className="institutional-btn small danger" type="button" onClick={() => deleteCatalogItem('departments', dept.id, dept.name)}>Delete</button>
              </div>
            </div>)}
          </div>
        </div>

        <div className="institutional-card catalog-section-card" style={{ marginBottom: '20px' }}>
          <div className="catalog-section-heading"><div><h3>{editingServiceId ? 'Edit Service' : 'Add Service'}</h3><p>Describe an available service and what requesters need to prepare.</p></div></div>
          <form className="catalog-form-grid" onSubmit={createService}>
            {isDepartmentScopedAdmin ? (
              <label className="catalog-field">Department<input className="institutional-input" value={getDepartmentNameById(user.department_id) || 'Your department'} readOnly /></label>
            ) : (
              <label className="catalog-field">Department<select className="institutional-select" value={serviceForm.department_id} onChange={(e) => setServiceForm({ ...serviceForm, department_id: e.target.value })} required>
                <option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.display_name || department.name}</option>)}
              </select></label>
            )}
            <label className="catalog-field">Service name<input className="institutional-input" placeholder="e.g. Certificate request" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required /></label>
            <label className="catalog-field">Requirements<input className="institutional-input" placeholder="Documents or information needed" value={serviceForm.requirements} onChange={(e) => setServiceForm({ ...serviceForm, requirements: e.target.value })} /></label>
            <label className="catalog-field">Processing time<input className="institutional-input" placeholder="e.g. 3 business days" value={serviceForm.processing_time} onChange={(e) => setServiceForm({ ...serviceForm, processing_time: e.target.value })} /></label>
            <button className="institutional-btn" type="submit">{editingServiceId ? 'Update Service' : 'Save Service'}</button>
            {editingServiceId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingServiceId(null); setServiceForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', name: '', requirements: '', processing_time: '' }); }}>Cancel edit</button>}
          </form>
          <div className="catalog-record-list" style={{ marginTop: '12px' }}>
            {services.length === 0 ? <p className="catalog-empty-state">No services are listed yet.</p> : services.map((service) => <div className="catalog-record" key={service.id}>
              <div className="catalog-record-copy"><strong>{service.name}</strong><span>{service.Department?.name || 'Department unavailable'}</span>{service.processing_time && <small>Processing time: {service.processing_time}</small>}</div>
              <div className="inline-actions">
                <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingServiceId(service.id); setServiceForm({ department_id: String(service.department_id), name: service.name || '', requirements: service.requirements || '', processing_time: service.processing_time || '' }); }}>Edit</button>
                <button className="institutional-btn small danger" type="button" onClick={() => deleteCatalogItem('services', service.id, service.name)}>Delete</button>
              </div>
            </div>)}
          </div>
        </div>

        <div className="institutional-card catalog-section-card" style={{ marginBottom: '20px' }}>
          <div className="catalog-section-heading">
            <div>
              <h3>{editingGeneralIssueId || editingSpecificIssueId ? 'Edit Issue Options' : 'General and Specific Issues'}</h3>
              <p>Manage the issue categories and selectable concerns shown on the ticket request form.</p>
            </div>
          </div>
          <form className="catalog-form-grid" onSubmit={saveGeneralIssue}>
            {isDepartmentScopedAdmin ? (
              <label className="catalog-field">Department<input className="institutional-input" value={getDepartmentNameById(user.department_id)} readOnly /></label>
            ) : (
              <label className="catalog-field">Department<select className="institutional-select" value={generalIssueForm.department_id} onChange={(e) => setGeneralIssueForm({ ...generalIssueForm, department_id: e.target.value })} required>
                <option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.display_name || department.name}</option>)}
              </select></label>
            )}
            <label className="catalog-field">General issue<input className="institutional-input" placeholder="e.g. Enrollment and registration" value={generalIssueForm.name} onChange={(e) => setGeneralIssueForm({ ...generalIssueForm, name: e.target.value })} required maxLength="100" /></label>
            <button className="institutional-btn" type="submit">{editingGeneralIssueId ? 'Update General Issue' : 'Add General Issue'}</button>
            {editingGeneralIssueId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingGeneralIssueId(null); setGeneralIssueForm({ department_id: '', name: '' }); }}>Cancel edit</button>}
          </form>

          <form className="catalog-form-grid catalog-issue-specific-form" onSubmit={saveSpecificIssue}>
            <label className="catalog-field">General issue<select className="institutional-select" value={specificIssueForm.general_issue_id} onChange={(e) => setSpecificIssueForm({ ...specificIssueForm, general_issue_id: e.target.value })} required disabled={Boolean(editingSpecificIssueId) || issueGroups.length === 0}>
              <option value="">Select a general issue</option>{issueGroups.map((group) => <option key={group.id} value={group.id}>{group.name} — {group.Department?.display_name || group.Department?.name || 'Department'}</option>)}
            </select></label>
            <label className="catalog-field">Specific issue<input className="institutional-input" placeholder="e.g. Add or drop a subject" value={specificIssueForm.name} onChange={(e) => setSpecificIssueForm({ ...specificIssueForm, name: e.target.value })} required maxLength="150" /></label>
            <button className="institutional-btn" type="submit" disabled={!editingSpecificIssueId && issueGroups.length === 0}>{editingSpecificIssueId ? 'Update Specific Issue' : 'Add Specific Issue'}</button>
            {editingSpecificIssueId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingSpecificIssueId(null); setSpecificIssueForm({ general_issue_id: '', name: '' }); }}>Cancel edit</button>}
          </form>

          <div className="catalog-issue-groups" aria-label="General and specific issue list">
            {issueGroups.length === 0 ? <p className="catalog-empty-state">No issue categories have been added yet.</p> : issueGroups.map((group) => (
              <section className="catalog-issue-group" key={group.id}>
                <div className="catalog-record">
                  <div className="catalog-record-copy"><strong>{group.name}</strong><span>{group.Department?.display_name || group.Department?.name || 'Department unavailable'}</span><small>{(group.specificIssues || []).length} specific issues</small></div>
                  <div className="inline-actions">
                    <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingGeneralIssueId(group.id); setEditingSpecificIssueId(null); setGeneralIssueForm({ department_id: String(group.department_id), name: group.name || '' }); }}>Edit</button>
                    <button className="institutional-btn small danger" type="button" onClick={() => deleteIssueItem('issues', group.id, group.name)}>Delete</button>
                  </div>
                </div>
                {(group.specificIssues || []).length > 0 ? (
                  <div className="catalog-issue-children">
                    {group.specificIssues.map((specificIssue) => (
                      <div className="catalog-record" key={specificIssue.id}>
                        <div className="catalog-record-copy"><strong>{specificIssue.name}</strong></div>
                        <div className="inline-actions">
                          <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingSpecificIssueId(specificIssue.id); setEditingGeneralIssueId(null); setSpecificIssueForm({ general_issue_id: String(group.id), name: specificIssue.name || '' }); }}>Edit</button>
                          <button className="institutional-btn small danger" type="button" onClick={() => deleteIssueItem('specific-issues', specificIssue.id, specificIssue.name)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="catalog-empty-state catalog-issue-empty">No specific issues yet.</p>}
              </section>
            ))}
          </div>
        </div>

        <div className="institutional-card catalog-section-card">
          <div className="catalog-section-heading"><div><h3>{editingFaqId ? 'Edit FAQ' : 'Add FAQ'}</h3><p>Maintain the answers and keywords used by AssistDesk to guide requesters.</p></div></div>
          <form className="catalog-form-grid" onSubmit={createFaq}>
            {isDepartmentScopedAdmin ? (
              <label className="catalog-field">Department<input className="institutional-input" value={getDepartmentNameById(user.department_id) || 'Your department'} readOnly /></label>
            ) : (
              <label className="catalog-field">Department<select className="institutional-select" value={faqForm.department_id} onChange={(e) => setFaqForm({ ...faqForm, department_id: e.target.value })} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                ))}
              </select></label>
            )}
            <label className="catalog-field">Question<input className="institutional-input" placeholder="Question as a requester might ask it" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} required /></label>
            <label className="catalog-field catalog-field-wide">Answer<textarea className="institutional-textarea" placeholder="Provide the approved answer" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} required /></label>
            <label className="catalog-field catalog-field-wide">Routing keywords<input className="institutional-input" placeholder="Separate related terms with commas" value={faqForm.keywords} onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })} /></label>
            <button className="institutional-btn" type="submit">{editingFaqId ? 'Update FAQ' : 'Save FAQ'}</button>
            {editingFaqId && <button className="institutional-btn small secondary" type="button" onClick={() => { setEditingFaqId(null); setFaqForm({ department_id: isDepartmentScopedAdmin ? String(user.department_id) : '', question: '', answer: '', keywords: '' }); }}>Cancel edit</button>}
          </form>
          <div className="catalog-record-list" style={{ marginTop: '12px' }}>
            {groupedFaqs.length === 0 && <p className="catalog-empty-state">No FAQs have been added yet.</p>}
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
        </>}
      </div>
    </div>
  );
}

export default AdminCatalogPage;
