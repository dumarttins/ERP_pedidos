import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';

const OrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    from: 1,
    to: 1,
    total: 0
  });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/orders?page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const { data } = response.data;
        setOrders(data.data);
        setPagination({
          currentPage: data.current_page,
          totalPages: data.last_page,
          from: data.from,
          to: data.to,
          total: data.total
        });
      } else {
        setError('Erro ao carregar pedidos');
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar pedidos');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handlePageChange = (page) => {
    fetchOrders(page);
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
      case 'cancelled':
        return <Badge bg="danger">Cancelado</Badge>;
      case 'completed':
        return <Badge bg="success">Concluído</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= pagination.totalPages; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === pagination.currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.First 
          onClick={() => handlePageChange(1)}
          disabled={pagination.currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
        />
        <Pagination.Last 
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.currentPage === pagination.totalPages}
        />
      </Pagination>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <Container className="my-4">
          <h1>Meus Pedidos</h1>
          <p>Carregando...</p>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container className="my-4">
          <h1>Meus Pedidos</h1>
          <p className="text-danger">{error}</p>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
          <>
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
                  <tr key={order.id}>
                    <td>#{order.order_number}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline-primary" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {renderPagination()}
            <div className="text-center mt-3">
              <small>Mostrando {pagination.from} até {pagination.to} de {pagination.total} pedidos</small>
            </div>
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default OrdersPage; 