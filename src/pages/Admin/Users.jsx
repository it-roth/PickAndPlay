import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge, Modal } from 'react-bootstrap';
import { userService } from '../../services/api';

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
    email: '',
    role: ''
  });
  
  const usersPerPage = 10;
  
  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    // Search by name or email
    const searchMatch = 
      searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by role
    const roleMatch = roleFilter === '' || user.role === roleFilter;
    
    return searchMatch && roleMatch;
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
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUser(selectedUser.id, userFormData);
      
      // Update user in the state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, ...userFormData } : user
      );
      setUsers(updatedUsers);
      
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };
  
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'warning';
      case 'USER':
      default:
        return 'info';
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
            <InputGroup.Text>Role</InputGroup.Text>
            <Form.Select
              value={roleFilter}
              onChange={handleRoleFilter}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="USER">User</option>
            </Form.Select>
          </InputGroup>
        </div>
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
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{`${user.firstName} ${user.lastName}`}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        onClick={() => handleEditUser(user)} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        Edit
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
      
      {/* Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={userFormData.firstName}
                onChange={handleFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={userFormData.lastName}
                onChange={handleFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={userFormData.email}
                onChange={handleFormChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={userFormData.role}
                onChange={handleFormChange}
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Users;