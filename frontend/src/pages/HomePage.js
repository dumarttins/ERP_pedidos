import React, { useState, useEffect } from 'react';
import { Row, Col, InputGroup, Input, Button, FormGroup, Label, Spinner } from 'reactstrap';
import MainLayout from '../layouts/MainLayout';
import ProductCard from '../components/ProductCard';
import { productService } from '../api/services';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll();
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos pelo termo de pesquisa e disponibilidade
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAvailability = showAvailableOnly ? product.is_available : true;
    
    return matchesSearch && matchesAvailability;
  });

  return (
    <MainLayout>
      <h1 className="mb-4">Produtos</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button color="primary">
              <i className="fas fa-search"></i>
            </Button>
          </InputGroup>
        </Col>
        <Col md={6} className="d-flex align-items-center mt-3 mt-md-0">
          <FormGroup check className="ms-md-auto">
            <Input
              type="checkbox"
              id="showAvailableOnly"
              checked={showAvailableOnly}
              onChange={() => setShowAvailableOnly(!showAvailableOnly)}
            />
            <Label check for="showAvailableOnly">
              Mostrar apenas produtos disponíveis
            </Label>
          </FormGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-5">
          <Spinner color="primary" />
          <p className="mt-2">Carregando produtos...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="alert alert-info">
          Nenhum produto encontrado. Tente ajustar seus filtros.
        </div>
      ) : (
        <Row>
          {filteredProducts.map((product) => (
            <Col sm={6} md={4} lg={3} className="mb-4" key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </MainLayout>
  );
};

export default HomePage;