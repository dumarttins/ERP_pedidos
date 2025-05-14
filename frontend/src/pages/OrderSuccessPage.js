import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  Table,
  Row,
  Col,
  Badge
} from 'reactstrap';
import MainLayout from '../layouts/MainLayout';
import { checkoutService } from '../api/services';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await checkoutService.getOrderDetails(id);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do pedido:', err);
      setError('Não foi possível carregar os detalhes do pedido. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Em Processamento';
      case 'completed':
        return 'Concluído';
      case 'shipped':
        return 'Enviado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'shipped':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center my-5">
          <Spinner color="primary" />
          <p className="mt-2">Carregando detalhes do pedido...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert color="danger">{error}</Alert>
        <Button color="primary" tag={Link} to="/">
          Voltar para a página inicial
        </Button>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <Alert color="warning">Pedido não encontrado.</Alert>
        <Button color="primary" tag={Link} to="/">
          Voltar para a página inicial
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="text-center mb-5">
        <div className="mb-4">
          <i className="fas fa-check-circle text-success" style={{ fontSize: '5rem' }}></i>
        </div>
        <h1 className="mb-3">Pedido Realizado com Sucesso!</h1>
        <p className="lead">
          Seu pedido <strong>#{order.order_number}</strong> foi confirmado e está sendo processado.
        </p>
        <p>
          Enviamos um e-mail para <strong>{order.customer_email}</strong> com os detalhes do seu pedido.
        </p>
      </div>

      <Card className="mb-4 shadow-sm">
        <CardBody>
          <h4 className="mb-4">Detalhes do Pedido</h4>
          
          <Row>
            <Col md={6}>
              <h6>Informações do Cliente</h6>
              <p>
                <strong>Nome:</strong> {order.customer_name}<br />
                <strong>E-mail:</strong> {order.customer_email}
              </p>
            </Col>
            <Col md={6}>
              <h6>Endereço de Entrega</h6>
              <p>
                {order.shipping_address}<br />
                {order.shipping_city} - {order.shipping_state}<br />
                CEP: {order.shipping_zipcode}<br />
                {order.shipping_country}
              </p>
            </Col>
          </Row>

          <h6 className="mt-4">Status do Pedido</h6>
          <p>
            <Badge
              color={getStatusColor(order.status)}
              className="px-3 py-2"
            >
              {getStatusText(order.status)}
            </Badge>
          </p>

          <h6 className="mt-4">Itens do Pedido</h6>
          <div className="table-responsive">
            <Table bordered striped>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.product.name}
                      {item.product_variation_id && item.product_variation && (
                        <small className="d-block text-muted">
                          Variação: {item.product_variation.name}
                        </small>
                      )}
                    </td>
                    <td>{item.quantity}</td>
                    <td>R$ {item.price.toFixed(2).replace('.', ',')}</td>
                    <td>R$ {item.total.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <Row className="mt-4">
            <Col md={6}></Col>
            <Col md={6}>
              <div className="border p-3 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Desconto:</span>
                    <span>- R$ {order.discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Frete:</span>
                  {order.shipping > 0 ? (
                    <span>R$ {order.shipping.toFixed(2).replace('.', ',')}</span>
                  ) : (
                    <span className="text-success">Grátis</span>
                  )}
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-0 fw-bold">
                  <span>Total:</span>
                  <span className="text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <div className="text-center mb-5">
        <Button color="primary" tag={Link} to="/" className="me-2">
          <i className="fas fa-home me-1"></i> Voltar para a Página Inicial
        </Button>
        <Button color="success" tag={Link} to={`/orders/${order.id}`}>
          <i className="fas fa-eye me-1"></i> Acompanhar Pedido
        </Button>
      </div>
    </MainLayout>
  );
};

export default OrderSuccessPage;