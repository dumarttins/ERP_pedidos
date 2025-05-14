import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Row, Col, Alert, FormGroup, Input, 
  Label, FormText, InputGroup, CustomInput
} from 'reactstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { productService } from '../../api/services';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = id !== undefined;
  
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    has_variations: false,
    stock_quantity: 0,
    variations: []
  });
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se estivermos no modo de edição, carregue os dados do produto
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const response = await productService.getById(id);
          if (response.data.success) {
            setProduct(response.data.data);
          } else {
            setProduct(response.data);
          }
          setLoading(false);
        } catch (err) {
          setError('Erro ao carregar dados do produto');
          setLoading(false);
          console.error(err);
        }
      };

      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'price' || name === 'stock_quantity') ? 
              Number(value) : value
    }));
  };

  const handleVariationChange = (index, field, value) => {
    const updatedVariations = [...product.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: field === 'price_adjustment' || field === 'stock_quantity' ? 
               Number(value) : value
    };
    setProduct({ ...product, variations: updatedVariations });
  };

  const addVariation = () => {
    setProduct({
      ...product,
      variations: [
        ...product.variations,
        { name: '', price_adjustment: 0, stock_quantity: 0 }
      ]
    });
  };

  const removeVariation = (index) => {
    const updatedVariations = [...product.variations];
    updatedVariations.splice(index, 1);
    setProduct({ ...product, variations: updatedVariations });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        // Atualizar produto existente
        await productService.update(id, product);
      } else {
        // Criar novo produto
        await productService.create(product);
      }
      
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar produto');
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="mb-3">
        <Link to="/admin/products" className="btn btn-light">
          Voltar
        </Link>
      </div>
      
      <h1>{isEditMode ? 'Editar Produto' : 'Criar Produto'}</h1>
      
      {error && <Alert color="danger">{error}</Alert>}
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <FormGroup className="mb-3">
            <Label for="name">Nome</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <Row>
            <Col md={6}>
              <FormGroup className="mb-3">
                <Label for="price">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  id="price"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </Col>
            
            <Col md={6}>
              <FormGroup className="mb-3">
                <div className="form-check">
                  <Input
                    type="checkbox"
                    id="has_variations"
                    name="has_variations"
                    checked={product.has_variations}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <Label for="has_variations" className="form-check-label">
                    Tem variações?
                  </Label>
                </div>
              </FormGroup>
            </Col>
          </Row>
          
          <FormGroup className="mb-3">
            <Label for="description">Descrição</Label>
            <Input
              type="textarea"
              rows={5}
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          {!product.has_variations && (
            <FormGroup className="mb-3">
              <Label for="stock_quantity">Quantidade em Estoque</Label>
              <Input
                type="number"
                min="0"
                id="stock_quantity"
                name="stock_quantity"
                value={product.stock_quantity}
                onChange={handleChange}
                required
              />
            </FormGroup>
          )}
          
          {product.has_variations && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Variações</h5>
                <Button type="button" color="success" size="sm" onClick={addVariation}>
                  <i className="fas fa-plus"></i> Adicionar Variação
                </Button>
              </div>
              
              {product.variations.length === 0 ? (
                <Alert color="info">
                  Adicione pelo menos uma variação para este produto.
                </Alert>
              ) : (
                product.variations.map((variation, index) => (
                  <div key={index} className="card mb-3 p-3">
                    <Row>
                      <Col md={4}>
                        <FormGroup className="mb-2">
                          <Label>Nome da Variação</Label>
                          <Input
                            type="text"
                            value={variation.name}
                            onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup className="mb-2">
                          <Label>Ajuste de Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variation.price_adjustment}
                            onChange={(e) => handleVariationChange(index, 'price_adjustment', e.target.value)}
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup className="mb-2">
                          <Label>Estoque</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variation.stock_quantity}
                            onChange={(e) => handleVariationChange(index, 'stock_quantity', e.target.value)}
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button
                          type="button"
                          color="danger"
                          size="sm"
                          className="mb-2"
                          onClick={() => removeVariation(index)}
                        >
                          <i className="fas fa-trash"></i> Remover
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))
              )}
            </div>
          )}
          
          <Button color="primary" type="submit">
            {isEditMode ? 'Atualizar' : 'Criar'}
          </Button>
        </Form>
      )}
    </MainLayout>
  );
};

export default ProductEditPage; 