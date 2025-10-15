import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge, Modal } from 'react-bootstrap';
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
    name: '',
    password: '',
    email: '',
    gender: '',
    role: 'USER',
    images: null
  });
  const [isCreating, setIsCreating] = useState(false);
  
  const usersPerPage = 10;
  
  // Filter users based on search term and gender
  const filteredUsers = users.filter(user => {
    // Search by name or email
    const searchMatch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by gender
    const genderMatch = roleFilter === '' || user.gender === roleFilter;
    
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
        setUsers(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
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
      name: user.name,
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
      name: '',
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
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
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
        // Create new user
        const response = await userService.createUser(userFormData);
        setUsers([...users, response.data]);
      } else {
        // Update existing user
        if (!selectedUser) return;
        await userService.updateUser(selectedUser.id, userFormData);
        
        // Update user in the state
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id ? { ...user, ...userFormData, images: user.images } : user
        );
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
      <h1 className="mb-4">User Management</h1>
      
      {/* Filters */}
      <div className="mb-4 row">
        <div className="col-md-6">
          <InputGroup>
            <InputGroup.Text>Search</InputGroup.Text>
            <Form.Control
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button 
              variant="outline-secondary"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </Button>
          </InputGroup>
        </div>
        
        <div className="col-md-3">
          <InputGroup>
            <InputGroup.Text>Gender</InputGroup.Text>
            <Form.Select
              value={roleFilter}
              onChange={handleRoleFilter}
            >
              <option value="">All Genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </Form.Select>
          </InputGroup>
        </div>
      </div>
      
      {/* Create User Button */}
      <div className="mb-3">
        <Button variant="primary" onClick={handleCreateUser}>
          <i className="bi bi-plus-circle me-2"></i>
          Create New User
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Profile Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getGenderBadgeVariant(user.gender)}>
                        {user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : 'Other'}
                      </Badge>
                    </td>
                    <td>
                      {user.images ? (
                        <img 
                          src={getImageUrl(user.images)} 
                          alt="Profile" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="text-muted">No image</span>
                      )}
                    </td>
                    <td>
                      <Button 
                        onClick={() => handleEditUser(user)} 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2"
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handleDeleteUser(user.id)} 
                        variant="outline-danger" 
                        size="sm"
                      >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          
          {/* User summary */}
          <div className="mb-4">
            <p className="mb-0">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={pageNumber} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isCreating ? 'Create New User' : 'Edit User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={userFormData.name}
                onChange={handleFormChange}
                placeholder="Enter full name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={userFormData.email}
                onChange={handleFormChange}
                placeholder="Enter email address"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password {isCreating ? '*' : '(leave blank to keep current)'}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={userFormData.password}
                onChange={handleFormChange}
                placeholder={isCreating ? "Enter password" : "Enter new password (optional)"}
                required={isCreating}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Gender *</Form.Label>
              <Form.Select
                name="gender"
                value={userFormData.gender}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                name="role"
                value={userFormData.role}
                onChange={handleFormChange}
                required
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control
                type="file"
                name="images"
                onChange={handleFormChange}
                accept="image/*"
              />
              <Form.Text className="text-muted">
                Upload a profile image (optional)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            {isCreating ? 'Create User' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Users;