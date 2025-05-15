import React from 'react';
import { Card, CardBody, CardHeader, CardFooter, Button, Badge } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Swal from 'sweetalert2';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    if (!product.has_variations) {
      try {
        const success = await addItem(product.id, 1);
        if (success) {
          Swal.fire({
            icon: 'success',
            title: 'Produto adicionado!',
            text: `${product.name} foi adicionado ao carrinho.`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível adicionar o produto ao carrinho.',
        });
      }
    } else {
      // Se o produto tem variações, redireciona para a página de detalhes
      // para que o usuário possa selecionar a variação desejada
    }
  };

  return (
    <Card className="product-card h-100 shadow-sm">
      <CardHeader>
        <h5 className="mb-0">{product.name}</h5>
      </CardHeader>
      <CardBody>
        <p className="card-text text-truncate">{product.description}</p>
        <p className="card-text fw-bold">
          R$ {(typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)).replace('.', ',')}
        </p>
        
        {product.has_variations && (
          <p className="text-muted small">
            <i className="fas fa-tags me-1"></i>
            Produto com {product.variations?.length || 0} variações
          </p>
        )}
        
        <p className="card-text">
          {product.is_available ? (
            <Badge color="success" className="px-2 py-1">
              <i className="fas fa-check-circle me-1"></i> Em estoque
            </Badge>
          ) : (
            <Badge color="danger" className="px-2 py-1">
              <i className="fas fa-times-circle me-1"></i> Fora de estoque
            </Badge>
          )}
        </p>
      </CardBody>
      <CardFooter className="d-flex justify-content-between">
        <div>
          <Button color="primary" size="sm" tag={Link} to={`/products/${product.id}`} className="me-1">
            <i className="fas fa-eye"></i> Detalhes
          </Button>
        </div>
        
        {product.is_available ? (
          product.has_variations ? (
            <Button color="success" size="sm" tag={Link} to={`/products/${product.id}`}>
              <i className="fas fa-shopping-cart"></i> Ver Opções
            </Button>
          ) : (
            <Button color="success" size="sm" onClick={handleAddToCart}>
              <i className="fas fa-shopping-cart"></i> Comprar
            </Button>
          )
        ) : (
          <Button color="secondary" size="sm" disabled>
            <i className="fas fa-shopping-cart"></i> Indisponível
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;