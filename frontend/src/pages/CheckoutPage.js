import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Alert,
  InputGroup,
  InputGroupText
} from 'reactstrap';
import { Formik, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import MainLayout from '../layouts/MainLayout';
import { useCart } from '../contexts/CartContext';
import { checkoutService } from '../api/services';
import Swal from 'sweetalert2';

// Schema de validação para o checkout
const CheckoutSchema = Yup.object().shape({
  customer_name: Yup.string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  customer_email: Yup.string()
    .email('E-mail inválido')
    .required('E-mail é obrigatório')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  shipping_address: Yup.string()
    .required('Endereço é obrigatório')
    .max(255, 'Endereço deve ter no máximo 255 caracteres'),
  shipping_city: Yup.string()
    .required('Cidade é obrigatória')
    .max(100, 'Cidade deve ter no máximo 100 caracteres'),
  shipping_state: Yup.string()
    .required('Estado é obrigatório')
    .max(100, 'Estado deve ter no máximo 100 caracteres'),
  shipping_zipcode: Yup.string()
    .required('CEP é obrigatório')
    .matches(/^[0-9]{5}-?[0-9]{3}$/, 'CEP inválido')
    .max(9, 'CEP deve ter no máximo 9 caracteres'),
  notes: Yup.string().max(1000, 'Observações devem ter no máximo 1000 caracteres')
});

const CheckoutPage = () => {
  const { cart, loading: cartLoading, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [zipCodeLoading, setZipCodeLoading] = useState(false);
  const navigate = useNavigate();

  // Valores iniciais do formulário
  const initialValues = {
    customer_name: '',
    customer_email: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zipcode: '',
    notes: ''
  };

  // Buscar endereço por CEP
  const fetchAddress = async (zipcode, setFieldValue) => {
    if (!zipcode || zipcode.length < 8) return;

    setZipCodeLoading(true);
    try {
      const response = await checkoutService.fetchAddress(zipcode);
      
      if (response.data.success) {
        const addressData = response.data.data;
        setFieldValue('shipping_address', `${addressData.address}, ${addressData.neighborhood}`);
        setFieldValue('shipping_city', addressData.city);
        setFieldValue('shipping_state', addressData.state);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setZipCodeLoading(false);
    }
  };

  // Formatar CEP ao digitar
  const formatZipCode = (value, setFieldValue) => {
    if (!value) return;
    
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Formata como XXXXX-XXX
    if (numericValue.length <= 5) {
      setFieldValue('shipping_zipcode', numericValue);
    } else {
      setFieldValue('shipping_zipcode', `${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`);
    }
    
    // Se tiver 8 dígitos, busca o endereço
    if (numericValue.length === 8) {
      fetchAddress(numericValue, setFieldValue);
    }
  };

  // Finalizar pedido
  const handleSubmit = async (values) => {
    if (cart.items.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Carrinho vazio',
        text: 'Adicione produtos ao carrinho antes de finalizar a compra.'
      });
      navigate('/');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await checkoutService.processOrder(values);
      
      if (response.data.success) {
        const { order_number, order } = response.data.data;
        
        // Limpa o carrinho
        await clearCart();
        
        // Redireciona para a página de sucesso
        navigate(`/checkout/success/${order.id}`);
      }
    } catch (err) {
      console.error('Erro ao processar pedido:', err);
      setError(err.response?.data?.message || 'Ocorreu um erro ao processar o pedido. Por favor, tente novamente.');
      
      // Exibe mensagem de erro
      Swal.fire({
        icon: 'error',
        title: 'Erro ao finalizar compra',
        text: err.response?.data?.message || 'Ocorreu um erro ao processar o pedido. Por favor, tente novamente.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <MainLayout>
        <div className="text-center my-5">
          <Spinner color="primary" />
          <p className="mt-2">Carregando informações do carrinho...</p>
        </div>
      </MainLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <MainLayout>
        <Alert color="warning">
          Seu carrinho está vazio. Adicione produtos antes de prosseguir para o checkout.
        </Alert>
        <Button color="primary" onClick={() => navigate('/')}>
          Ver Produtos
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1 className="mb-4">Finalizar Compra</h1>

      {error && (
        <Alert color="danger">{error}</Alert>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={CheckoutSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Card className="mb-4">
                  <CardHeader>
                    <h5 className="mb-0">Dados de Entrega</h5>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="customer_name">Nome Completo *</Label>
                          <Input
                            type="text"
                            name="customer_name"
                            id="customer_name"
                            value={values.customer_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.customer_name && !!errors.customer_name}
                          />
                          <ErrorMessage name="customer_name" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="customer_email">E-mail *</Label>
                          <Input
                            type="email"
                            name="customer_email"
                            id="customer_email"
                            value={values.customer_email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.customer_email && !!errors.customer_email}
                          />
                          <ErrorMessage name="customer_email" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="shipping_zipcode">CEP *</Label>
                          <InputGroup>
                            <Input
                              type="text"
                              name="shipping_zipcode"
                              id="shipping_zipcode"
                              value={values.shipping_zipcode}
                              onChange={(e) => {
                                formatZipCode(e.target.value, setFieldValue);
                              }}
                              onBlur={handleBlur}
                              invalid={touched.shipping_zipcode && !!errors.shipping_zipcode}
                              placeholder="00000-000"
                            />
                            {zipCodeLoading && (
                              <InputGroupText>
                                <Spinner size="sm" />
                              </InputGroupText>
                            )}
                          </InputGroup>
                          <ErrorMessage name="shipping_zipcode" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="shipping_address">Endereço Completo *</Label>
                          <Input
                            type="text"
                            name="shipping_address"
                            id="shipping_address"
                            value={values.shipping_address}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.shipping_address && !!errors.shipping_address}
                          />
                          <ErrorMessage name="shipping_address" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="shipping_city">Cidade *</Label>
                          <Input
                            type="text"
                            name="shipping_city"
                            id="shipping_city"
                            value={values.shipping_city}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.shipping_city && !!errors.shipping_city}
                          />
                          <ErrorMessage name="shipping_city" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="shipping_state">Estado *</Label>
                          <Input
                            type="text"
                            name="shipping_state"
                            id="shipping_state"
                            value={values.shipping_state}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.shipping_state && !!errors.shipping_state}
                          />
                          <ErrorMessage name="shipping_state" component="div" className="text-danger" />
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Label for="notes">Observações</Label>
                      <Input
                        type="textarea"
                        name="notes"
                        id="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.notes && !!errors.notes}
                        rows="3"
                      />
                      <ErrorMessage name="notes" component="div" className="text-danger" />
                    </FormGroup>
                  </CardBody>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="mb-4">
                  <CardHeader>
                    <h5 className="mb-0">Resumo do Pedido</h5>
                  </CardHeader>
                  <CardBody>
                    <div className="mb-3">
                      <h6>Itens:</h6>
                      <ul className="list-group">
                        {cart.items.map((item, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <span className="badge bg-primary rounded-pill me-2">{item.quantity}x</span>
                              {item.name}
                              {item.variation_name && (
                                <small className="d-block text-muted">
                                  Variação: {item.variation_name}
                                </small>
                              )}
                            </div>
                            <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <hr />

                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>R$ {(Number(cart.subtotal) || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    
                    {cart.discount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Desconto:</span>
                        <span>- R$ {(Number(cart.discount) || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span>Frete:</span>
                      {(Number(cart.shipping) || 0) > 0 ? (
                        <span>R$ {(Number(cart.shipping) || 0).toFixed(2).replace('.', ',')}</span>
                      ) : (
                        <span className="text-success">Grátis</span>
                      )}
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between mb-3 fw-bold">
                      <span>Total:</span>
                      <span className="text-primary fs-5">R$ {(Number(cart.total) || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button
                      color="success"
                      size="lg"
                      block
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <><Spinner size="sm" className="me-2" /> Processando...</>
                      ) : (
                        <><i className="fas fa-check me-2"></i> Finalizar Compra</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default CheckoutPage;