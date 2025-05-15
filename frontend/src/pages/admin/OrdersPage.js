import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Row, Col, Alert, 
  FormGroup, Input, Label, Pagination, PaginationItem, PaginationLink,
  Spinner
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { adminService } from '../../api/services';

const OrdersPage = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    from: 1,
    to: 1,
    total: 0
  });

  const fetchOrders = async (page = 1, status = filterStatus, search = searchTerm) => {
    setLoading(true);
    try {
      const params = { 
        page,
        ...(status ? { status } : {}),
        ...(search ? { search } : {})
      };
      
      const response = await adminService.getOrders(params);
      
      if (response.data && response.data.success) {
        const { data } = response.data;
        setOrders(data.data || []);
        setPagination({
          currentPage: data.current_page,
          totalPages: data.last_page,
          from: data.from || 0,
          to: data.to || 0,
          total: data.total || 0
        });
      } else {
        setOrders([]);
        console.warn('A resposta da API não contém os dados esperados:', response.data);
      }
    } catch (err) {
      setError('Erro ao carregar pedidos');
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePageChange = (page) => {
    fetchOrders(page, filterStatus, searchTerm);
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    fetchOrders(1, newStatus, searchTerm);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1, filterStatus, searchTerm);
  };

  const getStatusBadge = (status) => {
    let color = 'secondary';
    let text = status;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        text = 'Pendente';
        break;
      case 'processing':
        color = 'info';
        text = 'Processando';
        break;
      case 'shipped':
        color = 'primary';
        text = 'Enviado';
        break;
      case 'completed':
        color = 'success';
        text = 'Concluído';
        break;
      case 'cancelled':
      case 'canceled':
        color = 'danger';
        text = 'Cancelado';
        break;
      default:
        color = 'secondary';
        text = status || 'Desconhecido';
    }
    
    return <Badge color={color}>{text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    let items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    // Ajusta o startPage se estiver perto do final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <PaginationItem active={number === pagination.currentPage} key={number}>
          <PaginationLink onClick={() => handlePageChange(number)}>
            {number}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="d-flex justify-content-center mt-4">
        <PaginationItem disabled={pagination.currentPage === 1}>
          <PaginationLink first onClick={() => handlePageChange(1)} />
        </PaginationItem>
        <PaginationItem disabled={pagination.currentPage === 1}>
          <PaginationLink previous onClick={() => handlePageChange(pagination.currentPage - 1)} />
        </PaginationItem>
        
        {items}
        
        <PaginationItem disabled={pagination.currentPage === pagination.totalPages}>
          <PaginationLink next onClick={() => handlePageChange(pagination.currentPage + 1)} />
        </PaginationItem>
        <PaginationItem disabled={pagination.currentPage === pagination.totalPages}>
          <PaginationLink last onClick={() => handlePageChange(pagination.totalPages)} />
        </PaginationItem>
      </Pagination>
    );
  };

  return (
    <MainLayout>
      <h1 className="mb-4">Gerenciar Pedidos</h1>
      
      <Row className="mb-4">
        <Col md={8}>
          <form onSubmit={handleSearchSubmit}>
            <FormGroup>
              <Input
                type="text"
                name="search"
                id="search"
                placeholder="Buscar por ID, nome do cliente ou email..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </FormGroup>
          </form>
        </Col>
        <Col md={4}>
          <FormGroup>
            <Input
              type="select"
              name="status"
              id="status"
              value={filterStatus}
              onChange={handleStatusChange}
            >
              <option value="">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="shipped">Enviado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </Input>
          </FormGroup>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
          <p className="mt-3">Carregando pedidos...</p>
        </div>
      ) : (
        <>
          {error && <Alert color="danger">{error}</Alert>}

          {orders.length === 0 ? (
            <Alert color="info">
              Nenhum pedido encontrado.
            </Alert>
          ) : (
            <>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Nº do Pedido</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.order_number || order.id}</td>
                      <td>{order.customer_name || 'Cliente'}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <Link to={`/admin/orders/${order.id}`}>
                          <Button color="primary" size="sm">
                            Detalhes
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {renderPagination()}
              
              {pagination.total > 0 && (
                <div className="text-center mt-3">
                  <small>Mostrando {pagination.from} até {pagination.to} de {pagination.total} pedidos</small>
                </div>
              )}
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default OrdersPage; 