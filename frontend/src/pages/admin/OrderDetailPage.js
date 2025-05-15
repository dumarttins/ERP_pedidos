import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import { adminService } from '../../api/services';
import api from '../../api/config';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id, token]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      console.log('Order data:', response.data); // Log para debug
      setOrder(response.data.data);
      setStatusUpdate(response.data.data.status || 'pending');
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar detalhes do pedido');
      setLoading(false);
      console.error(err);
    }
  };

  const handleStatusChange = (e) => {
    setStatusUpdate(e.target.value);
  };

  const updateOrderStatus = async () => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: statusUpdate });
      setSuccessMessage('Status do pedido atualizado com sucesso!');
      fetchOrder();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Erro ao atualizar status do pedido');
      console.error(err);
      
      // Limpar mensagem de erro após 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pendente</Badge>;
      case 'processing':
        return <Badge bg="info">Processando</Badge>;
      case 'completed':
        return <Badge bg="success">Concluído</Badge>;
      case 'shipped':
        return <Badge bg="primary">Enviado</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
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

  const renderContent = () => {
    if (loading) {
      return (
        <Container className="my-4">
          <h1>Detalhes do Pedido</h1>
          <p>Carregando...</p>
        </Container>
      );
    }

    if (error && !order) {
      return (
        <Container className="my-4">
          <h1>Detalhes do Pedido</h1>
          <Alert variant="danger">{error}</Alert>
          <Link to="/admin/orders">
            <Button variant="secondary">Voltar para Pedidos</Button>
          </Link>
        </Container>
      );
    }

    if (!order) {
      return (
        <Container className="my-4">
          <h1>Pedido não encontrado</h1>
          <Link to="/admin/orders">
            <Button variant="secondary">Voltar para Pedidos</Button>
          </Link>
        </Container>
      );
    }

    return (
      <Container className="my-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Pedido #{order.order_number ? order.order_number.slice(-6) : id.slice(-6)}</h1>
          <Link to="/admin/orders">
            <Button variant="outline-secondary">Voltar para Pedidos</Button>
          </Link>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Card className="mb-4">
          <Card.Header as="h5">Informações do Pedido</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>ID:</strong> {order.id || '-'}</p>
                <p><strong>Data do Pedido:</strong> {formatDate(order.created_at)}</p>
                <p><strong>Cliente:</strong> {order.customer_name || '-'}</p>
                <p><strong>Email:</strong> {order.customer_email || '-'}</p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(order.status)}
                </p>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Atualizar Status:</strong></Form.Label>
                  <div className="d-flex">
                    <Form.Select 
                      value={statusUpdate} 
                      onChange={handleStatusChange}
                      className="me-2"
                    >
                      <option value="pending">Pendente</option>
                      <option value="processing">Processando</option>
                      <option value="completed">Concluído</option>
                      <option value="shipped">Enviado</option>
                      <option value="cancelled">Cancelado</option>
                    </Form.Select>
                    <Button variant="primary" onClick={updateOrderStatus}>
                      Atualizar
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header as="h5">Itens do Pedido</Card.Header>
              <Card.Body>
                {order.items && order.items.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Preço Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id || item._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.product && item.product.image && (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name} 
                                  style={{ width: '50px', marginRight: '10px' }} 
                                />
                              )}
                              <div>
                                {item.product ? (
                                  <Link to={`/products/${item.product.id}`}>
                                    {item.product.name}
                                  </Link>
                                ) : (
                                  <span>{item.name || 'Produto não disponível'}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>R$ {parseFloat(item.price).toFixed(2)}</td>
                          <td>R$ {(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>Nenhum item encontrado neste pedido</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Header as="h5">Resumo do Pedido</Card.Header>
              <Card.Body>
                <p><strong>Subtotal:</strong> R$ {parseFloat(order.subtotal || 0).toFixed(2)}</p>
                <p><strong>Frete:</strong> R$ {parseFloat(order.shipping || 0).toFixed(2)}</p>
                {parseFloat(order.discount) > 0 && (
                  <p><strong>Desconto de Cupom:</strong> -R$ {parseFloat(order.discount || 0).toFixed(2)}</p>
                )}
                <p className="fw-bold fs-5">
                  <strong>Total:</strong> R$ {parseFloat(order.total || 0).toFixed(2)}
                </p>
              </Card.Body>
            </Card>

            {order.shipping_address && (
              <Card className="mb-4">
                <Card.Header as="h5">Endereço de Entrega</Card.Header>
                <Card.Body>
                  <p><strong>Nome:</strong> {order.customer_name || '-'}</p>
                  <p><strong>Endereço:</strong> {order.shipping_address || '-'}</p>
                  <p><strong>Cidade:</strong> {order.shipping_city || '-'}</p>
                  <p><strong>Estado:</strong> {order.shipping_state || '-'}</p>
                  <p><strong>CEP:</strong> {order.shipping_zipcode || '-'}</p>
                  <p><strong>País:</strong> {order.shipping_country || '-'}</p>
                  {order.notes && <p><strong>Notas:</strong> {order.notes || '-'}</p>}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    );
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
};

export default OrderDetailPage; 