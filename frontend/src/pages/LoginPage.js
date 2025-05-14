import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Spinner
} from 'reactstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

// Schema de validação para o login
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('E-mail inválido')
    .required('E-mail é obrigatório'),
  password: Yup.string()
    .required('Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
});

const LoginPage = () => {
  const { login, error: authError, loading } = useAuth();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se há um redirecionamento após o login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (values) => {
    setError(null);
    
    try {
      const success = await login(values);
      if (success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('Erro ao fazer login. Por favor, tente novamente.');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-4">
            <h1 className="h3">Mini ERP</h1>
            <p className="lead text-muted">Faça login para acessar o sistema</p>
          </div>

          <Card className="shadow">
            <CardHeader className="bg-primary text-white text-center py-3">
              <h3 className="mb-0">Login</h3>
            </CardHeader>
            <CardBody className="p-4">
              {(error || authError) && (
                <Alert color="danger" className="mb-4">
                  {error || authError}
                </Alert>
              )}

              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                  <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                      <Label for="email">E-mail</Label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="seu@email.com"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.email && !!errors.email}
                      />
                      {touched.email && errors.email && (
                        <div className="text-danger mt-1">{errors.email}</div>
                      )}
                    </FormGroup>

                    <FormGroup className="mb-4">
                      <Label for="password">Senha</Label>
                      <Input
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Sua senha"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.password && !!errors.password}
                      />
                      {touched.password && errors.password && (
                        <div className="text-danger mt-1">{errors.password}</div>
                      )}
                    </FormGroup>

                    <Button
                      color="primary"
                      type="submit"
                      block
                      disabled={loading || isSubmitting}
                      className="mb-3"
                    >
                      {loading ? (
                        <><Spinner size="sm" className="me-2" /> Entrando...</>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </Form>
                )}
              </Formik>

              <div className="text-center mt-3">
                <p className="mb-1">
                  Não tem uma conta? <Link to="/register">Registre-se</Link>
                </p>
                <p className="mb-0">
                  <Link to="/">Voltar para a página inicial</Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;