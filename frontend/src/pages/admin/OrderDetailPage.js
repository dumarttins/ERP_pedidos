import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(response.data);
      setStatusUpdate(response.data.status);
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
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/orders/${id}/status`,
        { status: statusUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  const markAsPaid = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/orders/${id}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Pedido marcado como pago!');
      fetchOrder();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Erro ao marcar pedido como pago');
      console.error(err);
      
      // Limpar mensagem de erro após 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const markAsDelivered = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/orders/${id}/deliver`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Pedido marcado como entregue!');
      fetchOrder();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Erro ao marcar pedido como entregue');
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
      case 'shipped':
        return <Badge bg="primary">Enviado</Badge>;
      case 'delivered':
        return <Badge bg="success">Entregue</Badge>;
      case 'canceled':
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
        <h1>Pedido #{id.slice(-6)}</h1>
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
              <p><strong>ID:</strong> {order._id}</p>
              <p><strong>Data do Pedido:</strong> {formatDate(order.createdAt)}</p>
              <p><strong>Cliente:</strong> {order.user.name}</p>
              <p><strong>Email:</strong> {order.user.email}</p>
              <p>
                <strong>Status:</strong> {getStatusBadge(order.status)}
              </p>
            </Col>
            <Col md={6}>
              <p>
                <strong>Pago:</strong> {' '}
                {order.isPaid ? (
                  <Badge bg="success">Sim, em {formatDate(order.paidAt)}</Badge>
                ) : (
                  <Badge bg="danger">Não</Badge>
                )}
              </p>
              <p>
                <strong>Entregue:</strong> {' '}
                {order.isDelivered ? (
                  <Badge bg="success">Sim, em {formatDate(order.deliveredAt)}</Badge>
                ) : (
                  <Badge bg="danger">Não</Badge>
                )}
              </p>
              <p><strong>Método de Pagamento:</strong> {order.paymentMethod}</p>
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
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="canceled">Cancelado</option>
                  </Form.Select>
                  <Button variant="primary" onClick={updateOrderStatus}>
                    Atualizar
                  </Button>
                </div>
              </Form.Group>
              <div className="d-flex mt-3">
                {!order.isPaid && (
                  <Button 
                    variant="success" 
                    onClick={markAsPaid}
                    className="me-2"
                  >
                    Marcar como Pago
                  </Button>
                )}
                {!order.isDelivered && (
                  <Button 
                    variant="info" 
                    onClick={markAsDelivered}
                  >
                    Marcar como Entregue
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header as="h5">Itens do Pedido</Card.Header>
            <Card.Body>
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
                    <tr key={item.product._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.product.image && (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              style={{ width: '50px', marginRight: '10px' }} 
                            />
                          )}
                          <div>
                            <Link to={`/products/${item.product._id}`}>
                              {item.product.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>R$ {item.price.toFixed(2)}</td>
                      <td>R$ {(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header as="h5">Resumo do Pedido</Card.Header>
            <Card.Body>
              <p><strong>Subtotal:</strong> R$ {order.subtotal.toFixed(2)}</p>
              <p><strong>Frete:</strong> R$ {order.shippingPrice.toFixed(2)}</p>
              {order.couponDiscount > 0 && (
                <p><strong>Desconto de Cupom:</strong> -R$ {order.couponDiscount.toFixed(2)}</p>
              )}
              <p className="fw-bold fs-5">
                <strong>Total:</strong> R$ {order.totalPrice.toFixed(2)}
              </p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Endereço de Entrega</Card.Header>
            <Card.Body>
              <p><strong>Nome:</strong> {order.shippingAddress.name}</p>
              <p><strong>Endereço:</strong> {order.shippingAddress.address}</p>
              <p><strong>Cidade:</strong> {order.shippingAddress.city}</p>
              <p><strong>Estado:</strong> {order.shippingAddress.state}</p>
              <p><strong>CEP:</strong> {order.shippingAddress.zip}</p>
              <p><strong>Telefone:</strong> {order.shippingAddress.phone}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailPage; 