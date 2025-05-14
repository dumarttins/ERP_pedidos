import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Row, Col, Alert, FormGroup, 
  Input, Label, FormText
} from 'reactstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { couponService } from '../../api/services';

const CouponEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = id !== undefined;
  
  const [coupon, setCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_amount: '',
    expiry_date: '',
    max_uses: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Se estivermos no modo de edição, carregue os dados do cupom
    if (isEditMode) {
      const fetchCoupon = async () => {
        try {
          const response = await couponService.getById(id);
          
          // Formatar a data para o formato yyyy-MM-dd aceito pelo input date
          const couponData = response.data.data || response.data;
          if (couponData.expiry_date) {
            const date = new Date(couponData.expiry_date);
            const formattedDate = date.toISOString().split('T')[0];
            couponData.expiry_date = formattedDate;
          }
          
          setCoupon(couponData);
          setLoading(false);
        } catch (err) {
          setError('Erro ao carregar dados do cupom');
          setLoading(false);
          console.error(err);
        }
      };

      fetchCoupon();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setCoupon(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'discount_value' || name === 'min_amount' ? 
              value === '' ? '' : Number(value) : 
              name === 'max_uses' ? 
              value === '' ? null : Number(value) : 
              value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        // Atualizar cupom existente
        await couponService.update(id, coupon);
      } else {
        // Criar novo cupom
        await couponService.create(coupon);
      }
      
      navigate('/admin/coupons');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar cupom');
      console.error(err);
    }
  };

  return (
    <MainLayout>
      {loading ? (
        <div>
          <h1>{isEditMode ? 'Editar Cupom' : 'Criar Cupom'}</h1>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <Link to="/admin/coupons" className="btn btn-light">
              Voltar
            </Link>
          </div>
          
          <h1>{isEditMode ? 'Editar Cupom' : 'Criar Cupom'}</h1>
          
          {error && <Alert color="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <FormGroup className="mb-3">
              <Label for="code">Código do Cupom</Label>
              <Input
                type="text"
                id="code"
                name="code"
                value={coupon.code}
                onChange={handleChange}
                required
              />
              <FormText>
                Código que os clientes irão utilizar para aplicar o desconto.
              </FormText>
            </FormGroup>
            
            <Row>
              <Col md={6}>
                <FormGroup className="mb-3">
                  <Label for="discount_type">Tipo de Desconto</Label>
                  <Input
                    type="select"
                    id="discount_type"
                    name="discount_type"
                    value={coupon.discount_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </Input>
                </FormGroup>
              </Col>
              
              <Col md={6}>
                <FormGroup className="mb-3">
                  <Label for="discount_value">
                    {coupon.discount_type === 'percentage' ? 'Valor do Desconto (%)' : 'Valor do Desconto (R$)'}
                  </Label>
                  <Input
                    type="number"
                    step={coupon.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={coupon.discount_type === 'percentage' ? '100' : undefined}
                    id="discount_value"
                    name="discount_value"
                    value={coupon.discount_value}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <FormGroup className="mb-3">
                  <Label for="min_amount">Valor Mínimo de Compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    id="min_amount"
                    name="min_amount"
                    value={coupon.min_amount}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                  <FormText>
                    Deixe em branco se não houver valor mínimo.
                  </FormText>
                </FormGroup>
              </Col>
              
              <Col md={6}>
                <FormGroup className="mb-3">
                  <Label for="expiry_date">Data de Validade</Label>
                  <Input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={coupon.expiry_date}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                  <FormText>
                    Deixe em branco se o cupom não tiver data de validade.
                  </FormText>
                </FormGroup>
              </Col>
            </Row>
            
            <FormGroup className="mb-3">
              <Label for="max_uses">Número Máximo de Usos</Label>
              <Input
                type="number"
                min="1"
                id="max_uses"
                name="max_uses"
                value={coupon.max_uses === null ? '' : coupon.max_uses}
                onChange={handleChange}
                placeholder="Opcional"
              />
              <FormText>
                Deixe em branco para usos ilimitados.
              </FormText>
            </FormGroup>
            
            <FormGroup className="mb-3">
              <div className="form-check">
                <Input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  name="is_active"
                  checked={coupon.is_active}
                  onChange={handleChange}
                />
                <Label className="form-check-label" for="is_active">
                  Cupom Ativo
                </Label>
              </div>
              <FormText>
                Desmarque para desativar o cupom temporariamente.
              </FormText>
            </FormGroup>
            
            <Button color="primary" type="submit">
              {isEditMode ? 'Atualizar' : 'Criar'}
            </Button>
          </Form>
        </>
      )}
    </MainLayout>
  );
};

export default CouponEditPage; 