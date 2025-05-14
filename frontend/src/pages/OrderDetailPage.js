import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar detalhes do pedido');
        setLoading(false);
        console.error(err);
      }
    };

    fetchOrderDetails();
  }, [id, token]);

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

  if (error) {
    return (
      <Container className="my-4">
        <h1>Detalhes do Pedido</h1>
        <p className="text-danger">{error}</p>
        <Link to="/orders">
          <Button variant="secondary">Voltar para Meus Pedidos</Button>
        </Link>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="my-4">
        <h1>Pedido não encontrado</h1>
        <Link to="/orders">
          <Button variant="secondary">Voltar para Meus Pedidos</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Pedido #{id.slice(-6)}</h1>
        <Link to="/orders">
          <Button variant="outline-secondary">Voltar</Button>
        </Link>
      </div>

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

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header as="h5">Resumo do Pedido</Card.Header>
            <Card.Body>
              <p><strong>Data do Pedido:</strong> {formatDate(order.createdAt)}</p>
              <p>
                <strong>Status:</strong> {getStatusBadge(order.status)}
              </p>
              <hr />
              <p><strong>Subtotal:</strong> R$ {order.subtotal.toFixed(2)}</p>
              <p><strong>Frete:</strong> R$ {order.shippingPrice.toFixed(2)}</p>
              {order.couponDiscount > 0 && (
                <p><strong>Desconto:</strong> -R$ {order.couponDiscount.toFixed(2)}</p>
              )}
              <p className="fw-bold fs-5">
                <strong>Total:</strong> R$ {order.totalPrice.toFixed(2)}
              </p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Método de Pagamento</Card.Header>
            <Card.Body>
              <p><strong>Método:</strong> {order.paymentMethod}</p>
              {order.paymentResult && (
                <>
                  <p><strong>Status:</strong> {order.paymentResult.status}</p>
                  <p><strong>ID da Transação:</strong> {order.paymentResult.transactionId}</p>
                  <p><strong>Data:</strong> {formatDate(order.paymentResult.updateTime)}</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailPage; 