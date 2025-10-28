import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { userService, authService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { STORAGE_KEYS } from '../lib/constants';
import '../assets/styles/index.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    // Prefer fresh data from backend so avatar and other fields are up-to-date
    authService.getCurrentUser()
      .then(res => {
        if (!mounted) return;
        // backend may return { status:'success', data: user } or just user object
        const u = res?.data?.data || res?.data || res;
        if (u) {
          // normalize: if name present but firstName/lastName missing, derive
          const normalized = { ...u };
          if (!normalized.firstName && normalized.name) {
            const parts = String(normalized.name).split(' ');
            normalized.firstName = parts[0] || '';
            normalized.lastName = parts.slice(1).join(' ') || '';
          }
          setUser(normalized);
          try { localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalized)); } catch (e) { }
          if (import.meta.env.DEV) console.debug('Profile mounted, userData from API:', normalized);
        } else {
          throw new Error('no user');
        }
      })
      .catch(() => {
        // Fallback to localStorage for offline/dev mode
        const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setUser(parsed);
          } catch (e) {
            setUser(null);
          }
        }
        if (import.meta.env.DEV) console.debug('Profile mounted, userData from localStorage fallback:', raw);
      });
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If the user edits the combined "name" field, split it into firstName/lastName
    if (name === 'name') {
      const parts = String(value || '').trim().split(/\s+/);
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      setUser(prev => ({ ...prev, name: value, firstName: first, lastName: last }));
    } else {
      setUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setImageFile(f);
      try {
        setImagePreview(URL.createObjectURL(f));
      } catch (e) {
        setImagePreview(null);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const validate = () => {
    const err = {};
    if (newPassword && !oldPassword) {
      err.password = 'Please provide your current password to set a new password.';
    }
    if (!user?.email) {
      err.email = 'Email is required.';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    if (!validate()) return;
    setSaving(true);
    setMessage(null);
    try {
      // Always send multipart/form-data so backend RequestParam mapping works
      const form = new FormData();

      // Prefer explicit firstName/lastName fields; split name if needed
      const firstName = user.firstName || (user.name ? String(user.name).split(' ').slice(0, 1).join('') : '');
      const lastName = user.lastName || (user.name ? String(user.name).split(' ').slice(1).join(' ') : '');

      form.append('first_name', firstName);
      form.append('last_name', lastName);
      form.append('email', user.email || '');

      // Backend expects 'password' param for update; only include if user set a new password
      if (newPassword && newPassword.length > 0) {
        form.append('password', newPassword);
        form.append('old_password', oldPassword); // Send old password for validation
      }
      // Gender field expected as a single char by controller
      if (user.gender) form.append('gender', String(user.gender).charAt(0));
      // Append image file if present
      if (imageFile) form.append('images', imageFile);

      const resp = await userService.updateUser(user.id, form);

      // Check if response indicates password error
      const responseText = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      if (responseText.includes('Old password is incorrect')) {
        setMessage({ type: 'danger', text: 'Old password is incorrect. Please try again.' });
        setErrors({ password: 'Old password is incorrect' });
        setSaving(false);
        return;
      }
      if (responseText.includes('Old password is required')) {
        setMessage({ type: 'danger', text: 'Old password is required to change password.' });
        setErrors({ password: 'Old password is required' });
        setSaving(false);
        return;
      }

      // After updating, refresh current user from backend to get authoritative fields
      try {
        const me = await authService.getCurrentUser();
        const fresh = me?.data?.data || me?.data || null;
        if (fresh) {
          setUser(fresh);
          try { localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(fresh)); } catch (e) { }
          // if backend provided images or avatarUrl, update preview
          if (fresh.images) setImagePreview(getImageUrl(fresh.images));
          if (fresh.avatarUrl) setImagePreview(fresh.avatarUrl);
        } else {
          // Fallback: keep local merge
          const returned = resp?.data || {};
          const stored = { ...user, ...(returned?.user || returned) };
          delete stored.password;
          try { localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(stored)); } catch (e) { }
        }
      } catch (e) {
        // If /me failed, still persist a best-effort merge
        const returned = resp?.data || {};
        const stored = { ...user, ...(returned?.user || returned) };
        delete stored.password;
        try { localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(stored)); } catch (e) { }
      }

      setMessage({ type: 'success', text: 'Profile updated successfully. Refreshing page...' });

      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setErrors({});

      // Refresh page after 1.5 seconds to show all updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Failed to update user', err);
      setMessage({ type: 'danger', text: 'Failed to update profile. Please try again.' });
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-3" style={{ paddingTop: '20px' }}>
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="p-4 text-center">
              <h4>No profile data found</h4>
              <p>Please login to view and edit your profile.</p>
              <Button onClick={() => navigate('/login')}>Login</Button>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-3" style={{ paddingTop: '20px' }}>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-4">
            <h3 className="mb-3">Profile</h3>
            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'danger'}>{message.text}</Alert>
            )}

            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={4} className="d-flex flex-column align-items-center">
                  <div className="mb-3 text-center">
                    {imagePreview || user?.avatar || user?.images ? (
                      (() => {
                        // Build avatar URL the same way Navbar does. If the backend returned
                        // a filesystem path (Windows), getImageUrl now normalizes to filename.
                        const avatarUrl = imagePreview || getImageUrl(user?.avatar ? [user.avatar] : (user?.images || []));
                        if (import.meta.env.DEV) console.debug('Profile avatarUrl:', { avatarUrl, user });
                        return <Image src={avatarUrl} roundedCircle fluid style={{ width: 140, height: 140, objectFit: 'cover' }} />;
                      })()
                    ) : (
                      <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        {((user?.name || user?.firstName || 'U').split(' ').map(s => s[0]).slice(0, 2).join('') || 'U')}
                      </div>
                    )}
                  </div>
                  <Form.Group controlId="avatar" className="mb-2 w-100 text-center">
                    <Form.Label className="btn btn-success btn-sm mb-0">Choose avatar
                      <Form.Control type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </Form.Label>
                  </Form.Group>
                  {imagePreview && (
                    <Button variant="link" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</Button>
                  )}
                </Col>

                <Col md={8}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="firstName">
                        <Form.Label>First name</Form.Label>
                        <Form.Control name="firstName" value={user.firstName || ''} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="lastName">
                        <Form.Label>Last name</Form.Label>
                        <Form.Control name="lastName" value={user.lastName || ''} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control name="email" value={user.email || ''} onChange={handleChange} isInvalid={!!errors.email} />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="oldPassword">
                    <Form.Label>Current password (required to change password)</Form.Label>
                    <Form.Control name="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} isInvalid={!!errors.password} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>New password (leave blank to keep current)</Form.Label>
                    <Form.Control name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} isInvalid={!!errors.password} />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button variant="danger" className="me-2" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="btn-save-orange"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Link to="/orders" className="text-decoration-none">
                    <Card className="h-100 border-0 bg-light" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}>
                      <Card.Body className="text-center">
                        <i className="bi bi-clock-history display-4 text-primary mb-2"></i>
                        <h6 className="fw-bold">Order History</h6>
                        <small className="text-muted">View all your orders</small>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/shop" className="text-decoration-none">
                    <Card className="h-100 border-0 bg-light" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}>
                      <Card.Body className="text-center">
                        <i className="bi bi-bag-heart display-4 text-success mb-2"></i>
                        <h6 className="fw-bold">Continue Shopping</h6>
                        <small className="text-muted">Browse products</small>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/cart" className="text-decoration-none">
                    <Card className="h-100 border-0 bg-light" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}>
                      <Card.Body className="text-center">
                        <i className="bi bi-cart3 display-4 text-warning mb-2"></i>
                        <h6 className="fw-bold">Shopping Cart</h6>
                        <small className="text-muted">Review your cart</small>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
