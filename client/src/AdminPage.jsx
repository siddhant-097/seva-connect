import { useEffect, useState } from 'react';
import { Brand } from './components/SiteChrome.jsx';
import './AdminPage.css';

const ACCESS_ROLES = ['ADMIN', 'CONTENT_MANAGER'];
const CATEGORIES = [
  ['AGRICULTURE', 'Agriculture'], ['EDUCATION', 'Education'], ['HEALTHCARE', 'Health'],
  ['HOUSING', 'Housing'], ['EMPLOYMENT', 'Employment'], ['ENERGY', 'Energy'],
  ['SOCIAL_WELFARE', 'Social welfare'], ['WOMEN_EMPOWERMENT', 'Women'],
  ['FINANCIAL_INCLUSION', 'Financial inclusion'], ['PENSION', 'Pension'],
  ['INSURANCE', 'Insurance'], ['SKILL_DEVELOPMENT', 'Skills'], ['OTHER', 'Other'],
];
const EMPTY_FORM = {
  name: '', displayName: '', category: 'OTHER', cardCategory: 'Other',
  audience: '', cardDescription: '', description: '', department: '', state: 'ALL',
  benefits: '', applicationProcess: '', officialUrl: '', sourceType: 'UNVERIFIED',
  isActive: true, eligibilityRulesText: '[]', requiredDocumentsText: '[]',
};

async function readResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || 'Request failed.');
  return payload.data;
}

function toForm(scheme) {
  return {
    name: scheme.name || '', displayName: scheme.displayName || scheme.name || '',
    category: scheme.category || 'OTHER', cardCategory: scheme.cardCategory || 'Other',
    audience: scheme.audience || '', cardDescription: scheme.cardDescription || '',
    description: scheme.description || '', department: scheme.department || '',
    state: scheme.state || 'ALL', benefits: scheme.benefits || '',
    applicationProcess: scheme.applicationProcess || '', officialUrl: scheme.officialUrl || '',
    sourceType: scheme.sourceType || 'UNVERIFIED', isActive: scheme.isActive !== false,
    eligibilityRulesText: JSON.stringify(scheme.eligibilityRules || [], null, 2),
    requiredDocumentsText: JSON.stringify(scheme.requiredDocuments || [], null, 2),
  };
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schemes, setSchemes] = useState([]);
  const [schemeQuery, setSchemeQuery] = useState('');
  const [schemePage, setSchemePage] = useState(1);
  const [schemePagination, setSchemePagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [listRefresh, setListRefresh] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingSource, setEditingSource] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoadingSchemes(true);
      const params = new URLSearchParams({ page: String(schemePage), limit: '50' });
      if (schemeQuery.trim()) params.set('q', schemeQuery.trim());
      fetch('/api/v1/schemes/manage?' + params, { headers: { Authorization: 'Bearer ' + token }, signal: controller.signal })
      .then(readResponse)
      .then((data) => {
        if (!current) return;
        setSchemes(data.schemes || []);
        setSchemePagination(data.pagination || { page: schemePage, total: (data.schemes || []).length, totalPages: 1 });
      })
      .catch((requestError) => { if (current && requestError.name !== 'AbortError') setError(requestError.message); })
      .finally(() => { if (current) setLoadingSchemes(false); });
    }, schemeQuery.trim() ? 250 : 0);
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [token, schemePage, schemeQuery, listRefresh]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await readResponse(response);
      if (!ACCESS_ROLES.includes(data.user?.role)) throw new Error('This account does not have scheme management access.');
      setUser(data.user);
      setLoadingSchemes(true);
      setPassword('');
      setToken(data.accessToken);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const body = {
        ...form,
        eligibilityRules: JSON.parse(form.eligibilityRulesText || '[]'),
        requiredDocuments: JSON.parse(form.requiredDocumentsText || '[]'),
      };
      delete body.eligibilityRulesText;
      delete body.requiredDocumentsText;
      const response = await fetch(
        editingId ? '/api/v1/schemes/' + editingId : '/api/v1/schemes',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify(body),
        },
      );
      const data = await readResponse(response);
      const saved = data.scheme;
      if (editingId) {
        setSchemes((current) => current.map((item) => item.id === editingId ? { ...item, ...saved } : item));
      } else {
        setSchemePage(Math.max(1, Math.ceil(saved.displayOrder / 50)));
        setListRefresh((value) => value + 1);
      }
      setShowForm(false);
      setNotice(editingId ? 'Scheme updated.' : 'Scheme added to the catalogue.');
      setForm(EMPTY_FORM);
      setEditingSource(null);
      setEditingId('');
    } catch (saveError) {
      setError(saveError instanceof SyntaxError ? 'Rules and documents must be valid JSON.' : saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditingId('');
    setForm(EMPTY_FORM);
    setEditingSource(null);
    setShowForm(true);
    setError('');
    setNotice('');
  };
  const openEdit = async (scheme) => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await fetch('/api/v1/schemes/' + scheme.id, { headers: { Authorization: 'Bearer ' + token } });
      const data = await readResponse(response);
      setEditingId(scheme.id);
      setForm(toForm(data.scheme));
      setEditingSource(data.scheme);
      setShowForm(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    setToken('');
    setUser(null);
    setSchemes([]);
    setSchemeQuery('');
    setSchemePage(1);
    setSchemePagination({ page: 1, total: 0, totalPages: 0 });
    setEditingSource(null);
    setShowForm(false);
    setError('');
    setNotice('');
  };

  if (!token) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card">
          <a className="admin-home-link" href="/">← Back to homepage</a>
          <p className="admin-eyebrow admin-brand-label">SevaConnect Admin</p>
          <h1>Manage schemes</h1>
          <p className="admin-intro">Sign in with an administrator or content manager account.</p>
          {error && <p className="admin-alert" role="alert">{error}</p>}
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button className="admin-primary-button" type="submit" disabled={loading}>{loading ? 'Signing in�' : 'Sign in'}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Brand href="/" />
          <div className="admin-topbar-actions"><span>{user?.name || user?.email}</span><button type="button" className="admin-quiet-button" onClick={logout}>Sign out</button></div>
        </div>
      </header>
      <section className="admin-content">
        <div className="admin-heading">
          <div><p className="admin-eyebrow">Catalogue</p><h1>Manage schemes</h1><p className="admin-intro">Add a scheme or update the information shown to visitors.</p></div>
          <button className="admin-primary-button" type="button" onClick={openNew}>Add scheme</button>
        </div>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {notice && <p className="admin-success" role="status">{notice}</p>}
        {showForm && (
          <form className="admin-scheme-form" onSubmit={handleSave}>
            <div className="admin-form-heading"><h2>{editingId ? 'Edit scheme' : 'Add a scheme'}</h2><button type="button" className="admin-quiet-button" onClick={() => { setShowForm(false); setEditingSource(null); }}>Cancel</button></div>
            <div className="admin-form-grid">
              <label>Full scheme name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Name shown on card<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></label>
              <label>Scheme category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Card category<input value={form.cardCategory} onChange={(event) => setForm({ ...form, cardCategory: event.target.value })} required /></label>
              <label>Who the scheme is for<input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} required /></label>
              <label>Official website URL<input type="url" value={form.officialUrl} onChange={(event) => setForm({ ...form, officialUrl: event.target.value })} required /></label>
              <label className="admin-span-two">Short card description<textarea rows="2" value={form.cardDescription} onChange={(event) => setForm({ ...form, cardDescription: event.target.value })} required /></label>
              <label className="admin-span-two">Full description<textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
              <label>Department<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
              <label>State or ALL for national<input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label>
              <label className="admin-span-two">Benefits<textarea rows="2" value={form.benefits} onChange={(event) => setForm({ ...form, benefits: event.target.value })} /></label>
              <label className="admin-span-two">Application process<textarea rows="3" value={form.applicationProcess} onChange={(event) => setForm({ ...form, applicationProcess: event.target.value })} /></label>
              <label>Source status<select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}><option value="UNVERIFIED">Unverified</option><option value="OFFICIAL">Official source</option><option value="VERIFIED">Verified</option></select></label>
              <label className="admin-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Show in public catalogue</label>
              <label className="admin-span-two">Eligibility rules (JSON)<textarea className="admin-json-field" rows="6" value={form.eligibilityRulesText} onChange={(event) => setForm({ ...form, eligibilityRulesText: event.target.value })} spellCheck="false" /></label>
              <label className="admin-span-two">Required documents (JSON)<textarea className="admin-json-field" rows="6" value={form.requiredDocumentsText} onChange={(event) => setForm({ ...form, requiredDocumentsText: event.target.value })} spellCheck="false" /></label>
            </div>
            <p className="admin-form-help">Leave rules or documents as [] when you do not have verified details.</p>
            {editingSource?.dataSource && <p className="admin-form-help">Dataset provenance: {editingSource.dataSource}. <a href={editingSource.sourceUrl || editingSource.dataSourceUrl} target="_blank" rel="noreferrer">Review source</a></p>}
            <div className="admin-form-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving�' : editingId ? 'Save changes' : 'Add scheme'}</button></div>
          </form>
        )}
        <section className="admin-list-section">
          <h2>Catalogue entries <span>{schemePagination.total}</span></h2>
          <label className="admin-search">Search schemes<input type="search" value={schemeQuery} onChange={(event) => { setSchemeQuery(event.target.value); setSchemePage(1); }} placeholder="Name, state, or department" /></label>
          {loadingSchemes ? <p className="admin-empty">Loading schemes�</p> : schemes.length === 0 ? <p className="admin-empty">No schemes found.</p> : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Scheme</th><th>Category</th><th>Status</th><th>Source</th><th></th></tr></thead><tbody>
              {schemes.map((scheme) => (
                <tr key={scheme.id}>
                  <td><strong>{scheme.displayName || scheme.name}</strong><small>{scheme.name}</small></td>
                  <td>{scheme.cardCategory || scheme.category}</td>
                  <td><span className={scheme.isActive ? 'admin-status-active' : 'admin-status-inactive'}>{scheme.isActive ? 'Active' : 'Hidden'}</span></td>
                  <td>{scheme.sourceType || 'UNVERIFIED'}</td>
                  <td><button type="button" className="admin-edit-button" onClick={() => openEdit(scheme)}>Edit</button></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
          {!loadingSchemes && schemePagination.totalPages > 1 && <nav className="admin-pagination" aria-label="Catalogue pages"><button type="button" className="admin-quiet-button" disabled={schemePage <= 1} onClick={() => setSchemePage((page) => Math.max(1, page - 1))}>Previous</button><span>Page {schemePage} of {schemePagination.totalPages}</span><button type="button" className="admin-quiet-button" disabled={schemePage >= schemePagination.totalPages} onClick={() => setSchemePage((page) => Math.min(schemePagination.totalPages, page + 1))}>Next</button></nav>}
        </section>
      </section>
    </main>
  );
}
