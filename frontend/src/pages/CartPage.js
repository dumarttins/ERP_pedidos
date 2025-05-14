import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Table,
  Button,
  Input,
  InputGroup,
  InputGroupText,
  Alert,
  Spinner
} from 'reactstrap';
import MainLayout from '../layouts/MainLayout';
import { useCart } from '../contexts/CartContext';
import Swal from 'sweetalert2';

const CartPage = () => {
  const { cart, loading, error, updateItemQuantity, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuantityChange = async (itemIndex, quantity) => {
    if (quantity < 1) return;
    await updateItemQuantity(itemIndex, quantity);
  };

  const handleRemoveItem = async (itemIndex) => {
    Swal.fire({
      title: 'Remover item',
      text: 'Tem certeza que deseja remover este item do carrinho?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await removeItem(itemIndex);
      }
    });
  };

  const handleClearCart = () => {
    Swal.fire({
      title: 'Limpar carrinho',
      text: 'Tem certeza que deseja remover todos os itens do carrinho?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, limpar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await clearCart();
      }
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Por favor, informe um código de cupom válido.'
      });
      return;
    }

    setCouponLoading(true);
    const success = await applyCoupon(couponCode);
    setCouponLoading(false);

    if (!success) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Cupom inválido ou não aplicável para este pedido.'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Cupom aplicado!',
        text: 'O desconto foi aplicado ao seu carrinho.'
      });
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponCode('');
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center my-5">
          <Spinner color="primary" />
          <p className="mt-2">Carregando carrinho...</p>
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

  return (
    <MainLayout>
      <h1 className="mb-4">Seu Carrinho</h1>

      {cart.items.length === 0 ? (
        <Card className="text-center p-5">
          <CardBody>
            <i className="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
            <h3>Seu carrinho está vazio</h3>
            <p className="lead">Adicione produtos ao seu carrinho para continuar.</p>
            <Button color="primary" size="lg" tag={Link} to="/">
              Ver Produtos
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Itens do Carrinho</h5>
                  <Button color="danger" size="sm" outline onClick={handleClearCart}>
                    <i className="fas fa-trash me-1"></i> Limpar Carrinho
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Preço</th>
                      <th>Quantidade</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-bold">{item.name}</div>
                          {item.variation_name && (
                            <small className="text-muted">Variação: {item.variation_name}</small>
                          )}
                        </td>
                        <td>R$ {item.price.toFixed(2).replace('.', ',')}</td>
                        <td style={{ width: '120px' }}>
                          <InputGroup size="sm">
                            <Button
                              color="secondary"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <i className="fas fa-minus"></i>
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="text-center"
                            />
                            <Button
                              color="secondary"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            >
                              <i className="fas fa-plus"></i>
                            </Button>
                          </InputGroup>
                        </td>
                        <td>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
                        <td>
                          <Button color="danger" size="sm" onClick={() => handleRemoveItem(index)}>
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="mb-4">
              <CardHeader>
                <h5 className="mb-0">Resumo do Pedido</h5>
              </CardHeader>
              <CardBody>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>R$ {cart.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {cart.discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Desconto:</span>
                    <span>- R$ {cart.discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Frete:</span>
                  {cart.shipping > 0 ? (
                    <span>R$ {cart.shipping.toFixed(2).replace('.', ',')}</span>
                  ) : (
                    <span className="text-success">Grátis</span>
                  )}
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-3 fw-bold">
                  <span>Total:</span>
                  <span className="text-primary fs-5">R$ {cart.total.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {!cart.coupon_code ? (
                  <InputGroup className="mb-3">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button
                      color="secondary"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? <Spinner size="sm" /> : 'Aplicar'}
                    </Button>
                  </InputGroup>
                ) : (
                  <Alert color="success" className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold">Cupom aplicado: </span>
                      <span>{cart.coupon_code}</span>
                    </div>
                    <Button
                      color="link"
                      className="text-danger p-0"
                      onClick={handleRemoveCoupon}
                      title="Remover cupom"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </Alert>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  color="success"
                  size="lg"
                  block
                  onClick={handleCheckout}
                >
                  <i className="fas fa-check me-2"></i>
                  Finalizar Compra
                </Button>
                <div className="text-center mt-3">
                  <Button color="link" tag={Link} to="/">
                    <i className="fas fa-arrow-left me-1"></i>
                    Continuar Comprando
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      )}
    </MainLayout>
  );
};

export default CartPage;