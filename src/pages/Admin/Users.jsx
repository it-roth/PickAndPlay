import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge, Modal, Row, Col, Dropdown } from 'react-bootstrap';
import { userService } from '../../lib/api';
import { getImageUrl, isValidImageFile, formatFileSize } from '../../lib/utils';

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    gender: '',
    role: 'USER',
    images: null
  });
  const [isCreating, setIsCreating] = useState(false);
  
  const usersPerPage = 10;
  
  // Helper to compute a display name from available fields
  const getDisplayName = (u) => {
    if (!u) return '';
    if (u.name && String(u.name).trim() !== '') return String(u.name);
    const first = u.firstName || u.first_name || '';
    const last = u.lastName || u.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || (u.email || '');
  };

  // Filter users based on search term and gender
  // Only show users whose role contains 'user' (case-insensitive). This allows
  // variations like 'user', 'users', 'ROLE_USER', etc. Admin roles will be hidden.
  const filteredUsers = users
    .filter(u => {
      const role = (u.role || '').toString().toLowerCase();
      return role.includes('user');
    })
    .filter(user => {
      const lowerSearch = searchTerm.toLowerCase();
      const nameValue = getDisplayName(user).toLowerCase();
      const searchMatch = searchTerm === '' || nameValue.includes(lowerSearch) || (user.email || '').toLowerCase().includes(lowerSearch);

      const genderMatch = roleFilter === '' || (user.gender || '').toString() === roleFilter;
      return searchMatch && genderMatch;
    });
  
  // Paginate users
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        // Keep the full list in state but the UI will only surface users with role USER
        setUsers(response.data || []);
        setIsLoading(false);
      } catch (error) {
        if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName || user.first_name || (user.name ? String(user.name).split(' ').slice(0,1).join('') : ''),
      lastName: user.lastName || user.last_name || (user.name ? String(user.name).split(' ').slice(1).join(' ') : ''),
      password: '', // Don't populate password for security
      email: user.email,
      gender: user.gender,
      role: user.role ?? 'USER',
      images: null
    });
    setIsCreating(false);
    setShowModal(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      password: '',
      email: '',
      gender: 'M',
      role: 'USER',
      images: null
    });
    setIsCreating(true);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const SwalModule = await import('sweetalert2');
      const Swal = SwalModule.default || SwalModule;
      const confirm = await Swal.fire({
        title: 'Delete user?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545'
      });

      if (!confirm.isConfirmed) return;

      // optimistic update
      const prev = users;
      setUsers(prev.filter(u => u.id !== userId));

      try {
        const resp = await userService.deleteUser(userId);
        const notify = await import('../../lib/notify');
        try { await notify.showSuccess(resp?.data?.message || 'User deleted'); } catch (e) {}
      } catch (err) {
        // restore
        setUsers(prev);
        const notify = await import('../../lib/notify');
        const msg = err?.response?.data?.message || err?.message || 'Failed to delete user';
        try { await notify.showError(msg); } catch (e) { alert(msg); }
      }
    } catch (e) {
      if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('delete user flow failed', e);
      alert('Failed to delete user. Please try again.');
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'images' && files && files.length > 0) {
      const file = files[0];
      if (!isValidImageFile(file)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`File size too large. Maximum size is 5MB. Your file is ${formatFileSize(file.size)}`);
        e.target.value = '';
        return;
      }
    }
    
    setUserFormData(prev => ({
      ...prev,
      [name]: files ? files : value
    }));
  };
  
  const handleSaveUser = async () => {
    try {
      if (isCreating) {
        // Create new user using FormData with first_name/last_name
        const fd = new FormData();
        fd.append('first_name', userFormData.firstName || '');
        fd.append('last_name', userFormData.lastName || '');
        fd.append('password', userFormData.password || '');
        fd.append('email', userFormData.email || '');
        fd.append('gender', userFormData.gender ? String(userFormData.gender).charAt(0) : '');
        if (userFormData.role) fd.append('role', userFormData.role);
        if (userFormData.images && userFormData.images.length > 0) fd.append('images', userFormData.images[0]);
        const response = await userService.createUser(fd);
        // backend returns a success string; to keep UI updated, refetch or append from response if available
        // We'll optimistically append using the created fields (server id may not be present)
        setUsers(prev => [...prev, { id: response?.data?.id || Date.now(), firstName: userFormData.firstName, lastName: userFormData.lastName, email: userFormData.email, gender: userFormData.gender, role: userFormData.role, images: response?.data?.images || null }]);
      } else {
        // Update existing user
        if (!selectedUser) return;
        const fd = new FormData();
        fd.append('first_name', userFormData.firstName || '');
        fd.append('last_name', userFormData.lastName || '');
        fd.append('password', userFormData.password || '');
        fd.append('email', userFormData.email || '');
        if (userFormData.gender) fd.append('gender', String(userFormData.gender).charAt(0));
        if (userFormData.role) fd.append('role', userFormData.role);
        if (userFormData.images && userFormData.images.length > 0) fd.append('images', userFormData.images[0]);
        await userService.updateUser(selectedUser.id, fd);
        // Update user in state optimistically
        const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, firstName: userFormData.firstName, lastName: userFormData.lastName, email: userFormData.email, gender: userFormData.gender, images: u.images } : u);
        setUsers(updatedUsers);
      }
      
      setShowModal(false);
      setSelectedUser(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Failed to ${isCreating ? 'create' : 'update'} user. Please try again.`);
    }
  };
  
  const getGenderBadgeVariant = (gender) => {
    switch (gender) {
      case 'F':
        return 'success';
      case 'M':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Modern Header */}
      <div className="admin-header">
        <Row className="align-items-center">
          <Col>
            <h1 className="h2 mb-1 accent-text">
              <i className="bi bi-people-fill"> </i>

               User Management
            </h1>
            <p className="text-muted mb-0">Manage user accounts, edit profiles and roles, or create new users.</p>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Button onClick={handleCreateUser} className="modern-btn" aria-label="Create user">
                <i className="bi bi-plus-lg me-2"></i>
                Create New User
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      {/* Filters and actions */}
      <div className="mb-4 row align-items-center gx-3">
        <div className="col-md-6">
          <InputGroup className="shadow-sm rounded-pill overflow-hidden" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
            <InputGroup.Text className="bg-white border-0 px-3">
              <i className="bi bi-search text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="border-0"
              style={{ boxShadow: 'none' }}
            />
            <Button 
              variant="light"
              onClick={() => setSearchTerm('')}
              className="border-0 rounded-end"
              style={{ color: '#6b7280' }}
            >
              <i className="bi bi-x-lg" />
            </Button>
          </InputGroup>
        </div>
      </div>

      
      
      {isLoading ? (
        <div className="text-center py-5">
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <Table responsive className="product-table users-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th style={{ width: 260 }}>Profile Image</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 100 }}>Gender</th>
                <th style={{ width: 350 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user, idx) => (
                  <tr key={user.id}>
                    <td>{indexOfFirstUser + idx + 1}</td>
                    <td>
                      {user.images ? (
                        <img
                          src={getImageUrl(user.images)}
                          alt={user.name}
                          className="rounded-circle"
                          style={{ width: 44, height: 44, objectFit: 'cover', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                        />
                      ) : (
                        <div className="no-image-placeholder rounded-circle" style={{ width: 44, height: 44 }}>
                          <i className="bi bi-person text-muted" style={{ fontSize: '1.1rem' }} />
                        </div>
                      )}
                    </td>
                    <td>{getDisplayName(user)}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getGenderBadgeVariant(user.gender)}>
                        {user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : 'Other'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <i className="bi bi-pencil-square me-1" /> Edit
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <i className="bi bi-trash me-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    {searchTerm ? 'No users match your search criteria.' : 'No users available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item key={pageNumber} active={pageNumber === currentPage} onClick={() => handlePageChange(pageNumber)}>
                        {pageNumber}
                      </Pagination.Item>
                    );
                  }
                  if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                    return <Pagination.Ellipsis key={pageNumber} />;
                  }
                  return null;
                })}

                <Pagination.Next onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}
      {/* Create / Edit modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isCreating ? 'Create User' : 'Edit User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>First name</Form.Label>
                  <Form.Control name="firstName" value={userFormData.firstName} onChange={handleFormChange} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control name="lastName" value={userFormData.lastName} onChange={handleFormChange} />
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" value={userFormData.email} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control name="password" type="password" value={userFormData.password} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select name="gender" value={userFormData.gender} onChange={handleFormChange}>
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control name="images" type="file" accept="image/*" onChange={handleFormChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleSaveUser}>{isCreating ? 'Create' : 'Update'}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Users;