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
import { cartService } from '../api/services';

const CartPage = () => {
  const { cart, loading, error, updateItemQuantity, removeItem, clearCart, applyCoupon, removeCoupon, fetchCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleQuantityChange = async (itemIndex, quantity) => {
    if (quantity < 1) return;
    setLocalError('');
    
    try {
      const success = await updateItemQuantity(itemIndex, quantity);
      if (!success) {
        // Se a atualização falhar, recarregamos o carrinho mas exibimos um erro
        await fetchCart();
        setLocalError('Não foi possível atualizar a quantidade. O carrinho foi recarregado.');
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      setLocalError('Ocorreu um erro ao atualizar a quantidade.');
      // Recarrega o carrinho em caso de erro para garantir consistência
      await fetchCart();
    }
  };

  const handleRemoveItem = async (itemIndex) => {
    setLocalError('');
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
        const success = await removeItem(itemIndex);
        if (!success) {
          // If remove fails, refresh the cart
          await fetchCart();
        }
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

  const handleCheckout = async () => {
    // Verificar se há itens no carrinho antes de redirecionar
    if (!cart.items || cart.items.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Carrinho vazio',
        text: 'Adicione produtos ao seu carrinho para continuar.'
      });
      return;
    }
    
    try {
      // Atualiza o carrinho uma última vez antes de prosseguir
      await fetchCart();
      
      // Se após a atualização o carrinho estiver vazio, não prossegue
      if (!cart.items || cart.items.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Carrinho vazio',
          text: 'Não foi possível prosseguir com um carrinho vazio. Adicione produtos e tente novamente.'
        });
        return;
      }
      
      // Fazer uma cópia local do carrinho atual antes de redirecionar
      localStorage.setItem('cart_backup', JSON.stringify(cart));
      
      // Redireciona para a página de checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      setLocalError('Ocorreu um erro ao processar o checkout. Tente novamente.');
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Ocorreu um erro ao processar o checkout. Tente novamente.'
      });
    }
  };

  const handleRefreshCart = async () => {
    setLocalError('');
    try {
      await fetchCart();
      Swal.fire({
        icon: 'success',
        title: 'Carrinho atualizado',
        text: 'Seu carrinho foi atualizado com sucesso.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Erro ao atualizar carrinho:', error);
      setLocalError('Ocorreu um erro ao atualizar o carrinho.');
    }
  };

  const handleTestSession = async () => {
    try {
      // Teste da sessão
      const sessionResponse = await cartService.testSession();
      
      // Teste do carrinho no banco de dados
      const cartResponse = await cartService.testCart();
      
      console.log('Session test response:', sessionResponse.data);
      console.log('Cart test response:', cartResponse.data);
      
      // Obtém o cartId do localStorage
      const cartId = localStorage.getItem('cart_id') || 'não encontrado';
      
      let cartHtml = '';
      if (cartResponse.data.cart_exists) {
        cartHtml = `
          <p><strong>Carrinho no DB:</strong> Sim</p>
          <p><strong>ID no DB:</strong> ${cartResponse.data.cart_data.id}</p>
          <p><strong>Itens no DB:</strong> ${cartResponse.data.cart_data.items_count}</p>
          <p><strong>Subtotal:</strong> R$ ${cartResponse.data.cart_data.subtotal}</p>
          <p><strong>Total:</strong> R$ ${cartResponse.data.cart_data.total}</p>
        `;
      } else {
        cartHtml = `<p><strong>Carrinho no DB:</strong> Não encontrado</p>`;
      }
      
      Swal.fire({
        title: 'Informações da Sessão',
        html: `
          <div style="text-align: left">
            <h5>Informações Gerais</h5>
            <p><strong>Cart ID (Frontend):</strong> ${cartId}</p>
            <p><strong>Cart ID (Parâmetro):</strong> ${sessionResponse.data.cart_id_param || 'Não informado'}</p>
            <p><strong>Cart Token (Cookie):</strong> ${sessionResponse.data.cart_token_cookie || 'Não disponível'}</p>
            <p><strong>Session ID:</strong> ${sessionResponse.data.session_id || 'Não disponível'}</p>
            
            <h5>Banco de Dados</h5>
            ${cartHtml}
            
            <h5>Sessão</h5>
            <p><strong>Chave do carrinho:</strong> ${sessionResponse.data.cart_key || 'Não disponível'}</p>
            <p><strong>Carrinho existe na sessão:</strong> ${sessionResponse.data.cart_exists ? 'Sim' : 'Não'}</p>
            <p><strong>Quantidade de itens na sessão:</strong> ${sessionResponse.data.cart_items_count || 0}</p>
          </div>
        `,
        icon: 'info'
      });
    } catch (error) {
      console.error('Erro ao testar sessão:', error);
      Swal.fire({
        title: 'Erro ao testar sessão',
        text: 'Não foi possível obter informações da sessão',
        icon: 'error'
      });
    }
  };

  // Função para adicionar um produto de teste ao carrinho
  const handleAddTestProduct = async () => {
    try {
      // Adiciona um produto de teste ao carrinho
      const response = await cartService.addItem({
        product_id: 1, // ID do primeiro produto (ajuste conforme necessário)
        quantity: 1
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Produto de teste adicionado',
          text: 'Um produto de teste foi adicionado ao seu carrinho.'
        });
        
        // Atualiza o carrinho
        await fetchCart();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: response.data.message || 'Não foi possível adicionar o produto de teste.'
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar produto de teste:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Ocorreu um erro ao adicionar o produto de teste. Verifique o console para mais detalhes.'
      });
    }
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
            <div>
              <Button color="primary" size="lg" tag={Link} to="/" className="me-2">
                Ver Produtos
              </Button>
              <Button color="success" size="lg" onClick={handleAddTestProduct}>
                Adicionar Produto de Teste
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Itens do Carrinho</h5>
                  <div>
                    <Button color="success" size="sm" className="me-2" onClick={handleAddTestProduct}>
                      <i className="fas fa-plus me-1"></i> Adicionar Produto
                    </Button>
                    <Button color="info" size="sm" className="me-2" onClick={handleTestSession}>
                      <i className="fas fa-info-circle me-1"></i> Testar Sessão
                    </Button>
                    <Button color="primary" size="sm" className="me-2" onClick={handleRefreshCart}>
                      <i className="fas fa-sync-alt me-1"></i> Atualizar
                    </Button>
                    <Button color="danger" size="sm" outline onClick={handleClearCart}>
                      <i className="fas fa-trash me-1"></i> Limpar Carrinho
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {localError && (
                  <Alert color="danger" className="mb-3">
                    {localError}
                  </Alert>
                )}
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
                        <td>R$ {(typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)).replace('.', ',')}</td>
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
                        <td>R$ {((typeof item.price === 'number' ? item.price : parseFloat(item.price || 0)) * item.quantity).toFixed(2).replace('.', ',')}</td>
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
                  <span>R$ {(typeof cart.subtotal === 'number' ? cart.subtotal.toFixed(2) : parseFloat(cart.subtotal || 0).toFixed(2)).replace('.', ',')}</span>
                </div>
                
                {cart.discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Desconto:</span>
                    <span>- R$ {(typeof cart.discount === 'number' ? cart.discount.toFixed(2) : parseFloat(cart.discount || 0).toFixed(2)).replace('.', ',')}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Frete:</span>
                  {cart.shipping > 0 ? (
                    <span>R$ {(typeof cart.shipping === 'number' ? cart.shipping.toFixed(2) : parseFloat(cart.shipping || 0).toFixed(2)).replace('.', ',')}</span>
                  ) : (
                    <span className="text-success">Grátis</span>
                  )}
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-3 fw-bold">
                  <span>Total:</span>
                  <span className="text-primary fs-5">R$ {(typeof cart.total === 'number' ? cart.total.toFixed(2) : parseFloat(cart.total || 0).toFixed(2)).replace('.', ',')}</span>
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