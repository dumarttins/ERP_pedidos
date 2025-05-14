import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Alert, Input, FormGroup, Label } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { productService } from '../../api/services';

const ProductsPage = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data.data || response.data);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar produtos');
      setLoading(false);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await productService.delete(id);
        setSuccessMessage('Produto excluído com sucesso!');
        fetchProducts();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        setError('Erro ao excluir produto');
        console.error(err);
        
        // Limpar mensagem de erro após 3 segundos
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      {loading ? (
        <div>
          <h1>Gerenciar Produtos</h1>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          <Row className="align-items-center mb-4">
            <Col>
              <h1>Gerenciar Produtos</h1>
            </Col>
            <Col className="text-end">
              <Link to="/admin/products/create">
                <Button color="primary">Adicionar Produto</Button>
              </Link>
            </Col>
          </Row>

          {error && <Alert color="danger">{error}</Alert>}
          {successMessage && <Alert color="success">{successMessage}</Alert>}

          <FormGroup className="mb-3">
            <Input
              type="text"
              placeholder="Buscar por nome, categoria ou marca..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </FormGroup>

          {filteredProducts.length === 0 ? (
            <Alert color="info">
              Nenhum produto encontrado.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>R$ {Number(product.price).toFixed(2)}</td>
                    <td>
                      {product.is_available ? (
                        <span className="text-success">Disponível</span>
                      ) : (
                        <span className="text-danger">Indisponível</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button color="light" size="sm" className="me-2">
                          <i className="fas fa-edit"></i> Editar
                        </Button>
                      </Link>
                      <Button 
                        color="danger" 
                        size="sm" 
                        onClick={() => handleDelete(product.id)}
                      >
                        <i className="fas fa-trash"></i> Excluir
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

export default ProductsPage; 