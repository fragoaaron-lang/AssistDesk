import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';

function AdminCatalogPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '' });
  const [serviceForm, setServiceForm] = useState({ department_id: '', name: '', requirements: '', processing_time: '' });
  const [faqForm, setFaqForm] = useState({ department_id: '', question: '', answer: '', keywords: '' });
  const [message, setMessage] = useState('');

  const api = axios.create({
    baseURL: `${API_BASE_URL}/api/catalog`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadData = async () => {
    const [deptRes, serviceRes, faqRes] = await Promise.all([
      api.get('/departments'),
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
    await api.post('/departments', departmentForm);
    setDepartmentForm({ name: '', description: '', point_person: '', contact_number: '', location: '', office_hours: '' });
    loadData();
  };

  const createService = async (e) => {
    e.preventDefault();
    await api.post('/services', serviceForm);
    setServiceForm({ department_id: '', name: '', requirements: '', processing_time: '' });
    loadData();
  };

  const createFaq = async (e) => {
    e.preventDefault();
    await api.post('/faqs', faqForm);
    setFaqForm({ department_id: '', question: '', answer: '', keywords: '' });
    loadData();
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
                <a href="/admin/reports">Reports</a>
                <a href="/admin/catalog">Catalog</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <LogoutButton />
            <NotificationBell />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          </div>
          <div className="mobile-profile-summary">
            <div className="brand-badge small-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <div className="mobile-profile-name">{user?.name || 'User'}</div>
              <div className="mobile-profile-role">{user?.role || 'Member'}</div>
            </div>
          </div>
          <div className="nav-links">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Reports</a>
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
            <div className="mobile-menu-bell"><NotificationBell /></div>
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
          <h3>Add Department</h3>
          <form onSubmit={createDepartment}>
            <input className="institutional-input" placeholder="Name" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
            <input className="institutional-input" placeholder="Description" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} />
            <input className="institutional-input" placeholder="Point Person" value={departmentForm.point_person} onChange={(e) => setDepartmentForm({ ...departmentForm, point_person: e.target.value })} />
            <input className="institutional-input" placeholder="Contact Number" value={departmentForm.contact_number} onChange={(e) => setDepartmentForm({ ...departmentForm, contact_number: e.target.value })} />
            <input className="institutional-input" placeholder="Location" value={departmentForm.location} onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })} />
            <input className="institutional-input" placeholder="Office Hours" value={departmentForm.office_hours} onChange={(e) => setDepartmentForm({ ...departmentForm, office_hours: e.target.value })} />
            <button className="institutional-btn" type="submit">Save Department</button>
          </form>
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {departments.map((dept) => <div key={dept.id}>{dept.name} — {dept.point_person}</div>)}
          </div>
        </div>

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <h3>Add Service</h3>
          <form onSubmit={createService}>
            <input className="institutional-input" placeholder="Department ID" value={serviceForm.department_id} onChange={(e) => setServiceForm({ ...serviceForm, department_id: e.target.value })} required />
            <input className="institutional-input" placeholder="Service Name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
            <input className="institutional-input" placeholder="Requirements" value={serviceForm.requirements} onChange={(e) => setServiceForm({ ...serviceForm, requirements: e.target.value })} />
            <input className="institutional-input" placeholder="Processing Time" value={serviceForm.processing_time} onChange={(e) => setServiceForm({ ...serviceForm, processing_time: e.target.value })} />
            <button className="institutional-btn" type="submit">Save Service</button>
          </form>
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {services.map((service) => <div key={service.id}>{service.name}</div>)}
          </div>
        </div>

        <div className="institutional-card">
          <h3>Add FAQ</h3>
          <form onSubmit={createFaq}>
            <input className="institutional-input" placeholder="Department ID" value={faqForm.department_id} onChange={(e) => setFaqForm({ ...faqForm, department_id: e.target.value })} required />
            <input className="institutional-input" placeholder="Question" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} required />
            <input className="institutional-input" placeholder="Answer" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} required />
            <input className="institutional-input" placeholder="Keywords" value={faqForm.keywords} onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })} />
            <button className="institutional-btn" type="submit">Save FAQ</button>
          </form>
          <div className="list-stack" style={{ marginTop: '12px' }}>
            {faqs.map((faq) => <div key={faq.id}>{faq.question}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCatalogPage;
