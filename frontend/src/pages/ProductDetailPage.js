import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Button,
  Badge,
  Input,
  FormGroup,
  Label,
  Spinner,
  Alert
} from 'reactstrap';
import MainLayout from '../layouts/MainLayout';
import { productService } from '../api/services';
import { useCart } from '../contexts/CartContext';
import Swal from 'sweetalert2';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productService.getById(id);
      if (response.data.success) {
        setProduct(response.data.data);
        
        // Se o produto tem variações e há pelo menos uma disponível,
        // seleciona a primeira disponível por padrão
        if (response.data.data.has_variations && response.data.data.variations.length > 0) {
          const availableVariation = response.data.data.variations.find(v => v.is_available);
          if (availableVariation) {
            setSelectedVariation(availableVariation.id);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setError('Não foi possível carregar os detalhes do produto.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleVariationChange = (e) => {
    setSelectedVariation(parseInt(e.target.value));
  };

  const handleAddToCart = async () => {
    try {
      const success = await addItem(
        product.id,
        quantity,
        product.has_variations ? selectedVariation : null
      );
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Produto adicionado!',
          text: `${product.name} foi adicionado ao carrinho.`,
          showCancelButton: true,
          confirmButtonText: 'Ir para o carrinho',
          cancelButtonText: 'Continuar comprando'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/cart');
          }
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível adicionar o produto ao carrinho.',
      });
    }
  };

  // Verifica se a variação selecionada está disponível
  const getSelectedVariationObject = () => {
    if (!product || !product.has_variations || !selectedVariation) return null;
    return product.variations.find(v => v.id === selectedVariation);
  };

  const isProductAvailable = () => {
    if (!product) return false;
    
    if (product.has_variations) {
      const variation = getSelectedVariationObject();
      return variation && variation.is_available;
    }
    
    return product.is_available;
  };

  // Calcula o preço atual com base na variação selecionada
  const getCurrentPrice = () => {
    if (!product) return 0;
    
    if (product.has_variations && selectedVariation) {
      const variation = getSelectedVariationObject();
      return variation ? variation.final_price : product.price;
    }
    
    return product.price;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center my-5">
          <Spinner color="primary" />
          <p className="mt-2">Carregando detalhes do produto...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert color="danger">{error}</Alert>
        <Button color="primary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <Alert color="warning">Produto não encontrado.</Alert>
        <Button color="primary" onClick={() => navigate('/')}>
          Voltar para a página inicial
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-3">
        <Button color="light" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-1"></i> Voltar
        </Button>
      </div>

      <Row>
        <Col md={8}>
          <h1>{product.name}</h1>
          <p className="lead">{product.description}</p>

          <Card className="mb-4">
            <CardBody>
              <Row>
                <Col md={6}>
                  <h5>Preço</h5>
                  <h3 className="text-primary mb-3">
                    R$ {getCurrentPrice().toFixed(2).replace('.', ',')}
                  </h3>

                  <h5>Disponibilidade</h5>
                  {isProductAvailable() ? (
                    <Badge color="success" className="px-2 py-1">
                      <i className="fas fa-check-circle me-1"></i> Em estoque
                    </Badge>
                  ) : (
                    <Badge color="danger" className="px-2 py-1">
                      <i className="fas fa-times-circle me-1"></i> Fora de estoque
                    </Badge>
                  )}
                </Col>

                <Col md={6}>
                  {product.has_variations && (
                    <FormGroup>
                      <Label for="variation">Selecione a variação</Label>
                      <Input
                        type="select"
                        id="variation"
                        value={selectedVariation || ''}
                        onChange={handleVariationChange}
                      >
                        <option value="">Selecione...</option>
                        {product.variations.map((variation) => (
                          <option
                            key={variation.id}
                            value={variation.id}
                            disabled={!variation.is_available}
                          >
                            {variation.name} - R$ {variation.final_price.toFixed(2).replace('.', ',')}
                            {!variation.is_available && ' (Indisponível)'}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  )}

                  <FormGroup>
                    <Label for="quantity">Quantidade</Label>
                    <Input
                      type="number"
                      id="quantity"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                    />
                  </FormGroup>

                  <Button
                    color="success"
                    block
                    size="lg"
                    className="mt-3"
                    onClick={handleAddToCart}
                    disabled={!isProductAvailable() || (product.has_variations && !selectedVariation)}
                  >
                    <i className="fas fa-shopping-cart me-2"></i>
                    Adicionar ao Carrinho
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col md={4}>
          {product.has_variations && (
            <Card className="mb-4">
              <CardBody>
                <h5 className="mb-3">Variações Disponíveis</h5>
                <Table>
                  <thead>
                    <tr>
                      <th>Variação</th>
                      <th>Preço</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variations.map((variation) => (
                      <tr key={variation.id}>
                        <td>{variation.name}</td>
                        <td>R$ {variation.final_price.toFixed(2).replace('.', ',')}</td>
                        <td>
                          {variation.is_available ? (
                            <Badge color="success" pill>Disponível</Badge>
                          ) : (
                            <Badge color="danger" pill>Indisponível</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>
    </MainLayout>
  );
};

export default ProductDetailPage;