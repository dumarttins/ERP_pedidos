import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// Schema de validação para registro
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  email: Yup.string()
    .email('E-mail inválido')
    .required('E-mail é obrigatório')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  password: Yup.string()
    .required('Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(255, 'Senha deve ter no máximo 255 caracteres'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Senhas não conferem')
    .required('Confirmação de senha é obrigatória')
});

const RegisterPage = () => {
  const { register, error: authError, loading } = useAuth();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setError(null);
    
    try {
      const success = await register(values);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError('Erro ao registrar usuário. Por favor, tente novamente.');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-4">
            <h1 className="h3">Mini ERP</h1>
            <p className="lead text-muted">Crie sua conta para acessar o sistema</p>
          </div>

          <Card className="shadow">
            <CardHeader className="bg-primary text-white text-center py-3">
              <h3 className="mb-0">Registrar</h3>
            </CardHeader>
            <CardBody className="p-4">
              {(error || authError) && (
                <Alert color="danger" className="mb-4">
                  {error || authError}
                </Alert>
              )}

              <Formik
                initialValues={{ name: '', email: '', password: '', password_confirmation: '' }}
                validationSchema={RegisterSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                  <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                      <Label for="name">Nome</Label>
                      <Input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Nome completo"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.name && !!errors.name}
                      />
                      {touched.name && errors.name && (
                        <div className="text-danger mt-1">{errors.name}</div>
                      )}
                    </FormGroup>

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

                    <FormGroup className="mb-3">
                      <Label for="password">Senha</Label>
                      <Input
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Crie uma senha segura"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.password && !!errors.password}
                      />
                      {touched.password && errors.password && (
                        <div className="text-danger mt-1">{errors.password}</div>
                      )}
                    </FormGroup>

                    <FormGroup className="mb-4">
                      <Label for="password_confirmation">Confirme a Senha</Label>
                      <Input
                        type="password"
                        name="password_confirmation"
                        id="password_confirmation"
                        placeholder="Confirme sua senha"
                        value={values.password_confirmation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.password_confirmation && !!errors.password_confirmation}
                      />
                      {touched.password_confirmation && errors.password_confirmation && (
                        <div className="text-danger mt-1">{errors.password_confirmation}</div>
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
                        <><Spinner size="sm" className="me-2" /> Registrando...</>
                      ) : (
                        'Criar Conta'
                      )}
                    </Button>
                  </Form>
                )}
              </Formik>

              <div className="text-center mt-3">
                <p className="mb-1">
                  Já tem uma conta? <Link to="/login">Faça login</Link>
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

export default RegisterPage;