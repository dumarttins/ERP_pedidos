import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Alert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { couponService } from '../../api/services';

const CouponsPage = () => {
  const { isAdmin } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await couponService.getAll();
      setCoupons(response.data.data || response.data);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar cupons');
      setLoading(false);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      try {
        await couponService.delete(id);
        setSuccessMessage('Cupom excluído com sucesso!');
        fetchCoupons();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        setError('Erro ao excluir cupom');
        console.error(err);
        
        // Limpar mensagem de erro após 3 segundos
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await couponService.update(id, { active: !isActive });
      setSuccessMessage(`Cupom ${isActive ? 'desativado' : 'ativado'} com sucesso!`);
      fetchCoupons();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Erro ao atualizar status do cupom');
      console.error(err);
      
      // Limpar mensagem de erro após 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <MainLayout>
      {loading ? (
        <div>
          <h1>Gerenciar Cupons</h1>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          <Row className="align-items-center mb-4">
            <Col>
              <h1>Gerenciar Cupons</h1>
            </Col>
            <Col className="text-end">
              <Link to="/admin/coupons/create">
                <Button color="primary">Adicionar Cupom</Button>
              </Link>
            </Col>
          </Row>

          {error && <Alert color="danger">{error}</Alert>}
          {successMessage && <Alert color="success">{successMessage}</Alert>}

          {coupons.length === 0 ? (
            <Alert color="info">
              Nenhum cupom encontrado.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Desconto</th>
                  <th>Tipo</th>
                  <th>Valor Mínimo</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th>Usos Restantes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>{coupon.code}</td>
                    <td>
                      {coupon.type === 'percentage' 
                        ? `${coupon.value}%` 
                        : `R$ ${Number(coupon.value).toFixed(2)}`}
                    </td>
                    <td>
                      {coupon.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                    </td>
                    <td>
                      {coupon.min_value ? `R$ ${Number(coupon.min_value).toFixed(2)}` : 'N/A'}
                    </td>
                    <td>
                      {coupon.valid_until ? formatDate(coupon.valid_until) : 'Sem validade'}
                    </td>
                    <td>
                      <span className={`badge bg-${coupon.active ? 'success' : 'danger'}`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {coupon.max_uses === null ? 'Ilimitado' : 
                        (coupon.used_times 
                          ? `${coupon.max_uses - coupon.used_times}/${coupon.max_uses}` 
                          : `${coupon.max_uses}/${coupon.max_uses}`)}
                    </td>
                    <td>
                      <Button 
                        color={coupon.active ? 'warning' : 'success'} 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleToggleActive(coupon.id, coupon.active)}
                      >
                        {coupon.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Link to={`/admin/coupons/${coupon.id}/edit`}>
                        <Button color="light" size="sm" className="me-2">
                          Editar
                        </Button>
                      </Link>
                      <Button 
                        color="danger" 
                        size="sm" 
                        onClick={() => handleDelete(coupon.id)}
                      >
                        Excluir
                      </Button>
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

export default CouponsPage; 