import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Row, Col, Alert,
  FormGroup, Input, Label
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminService.getOrders();
      if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data))) {
        setOrders(Array.isArray(response.data.data) ? response.data.data : response.data);
      } else {
        setOrders([]);
        console.warn('A resposta da API não contém um array de pedidos:', response.data);
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar pedidos');
      setLoading(false);
      console.error(err);
    }
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
      case 'delivered':
        color = 'success';
        text = 'Entregue';
        break;
      case 'canceled':
        color = 'danger';
        text = 'Cancelado';
        break;
    }
    
    return <Badge color={color}>{text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('pt-BR', options);
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return '';
    }
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const matchesStatus = filterStatus === '' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      (order.id && order.id.toString().includes(searchTerm.toLowerCase())) ||
      (order.user && order.user.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.shipping_address && order.shipping_address.email && 
       order.shipping_address.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  }) : [];

  return (
    <MainLayout>
      {loading ? (
        <div>
          <h1>Gerenciar Pedidos</h1>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          <h1>Gerenciar Pedidos</h1>

          {error && <Alert color="danger">{error}</Alert>}

          <Row className="mb-3">
            <Col md={6}>
              <FormGroup>
                <Input
                  type="text"
                  placeholder="Buscar por ID, nome do cliente ou email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Input 
                  type="select"
                  value={filterStatus} 
                  onChange={handleStatusFilter}
                >
                  <option value="">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="canceled">Cancelado</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          {filteredOrders.length === 0 ? (
            <Alert color="info">
              Nenhum pedido encontrado.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id || index}>
                    <td>#{(order.id || '').toString().slice(-6)}</td>
                    <td>{order.user ? order.user.name : 'Cliente'}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>R$ {Number(order.total_price || 0).toFixed(2)}</td>
                    <td>
                      {order.is_paid ? (
                        <Badge color="success">Pago em {formatDate(order.paid_at)}</Badge>
                      ) : (
                        <Badge color="danger">Não Pago</Badge>
                      )}
                    </td>
                    <td>{getStatusBadge(order.status || 'pending')}</td>
                    <td>
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button color="light" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default OrdersPage; 