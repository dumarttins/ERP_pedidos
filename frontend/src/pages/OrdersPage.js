import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const OrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar pedidos');
        setLoading(false);
        console.error(err);
      }
    };

    fetchOrders();
  }, [token]);

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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (loading) {
    return (
      <Container className="my-4">
        <h1>Meus Pedidos</h1>
        <p>Carregando...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <h1>Meus Pedidos</h1>
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1>Meus Pedidos</h1>
      
      {orders.length === 0 ? (
        <div className="text-center my-5">
          <p>Você ainda não fez nenhum pedido.</p>
          <Link to="/">
            <Button variant="primary">Começar a Comprar</Button>
          </Link>
        </div>
      ) : (
        <Table responsive striped hover className="mt-4">
          <thead>
            <tr>
              <th>Nº do Pedido</th>
              <th>Data</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>#{order._id.slice(-6)}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>R$ {order.totalPrice.toFixed(2)}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <Link to={`/orders/${order._id}`}>
                    <Button variant="outline-primary" size="sm">
                      Detalhes
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default OrdersPage; 