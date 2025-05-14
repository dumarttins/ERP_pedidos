import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <h5>Mini ERP</h5>
            <p>Sistema de gerenciamento de pedidos, produtos, cupons e estoque.</p>
          </Col>
          <Col md={6} className="text-md-end">
            <h5>Contato</h5>
            <p>Email: contato@example.com<br />Telefone: (11) 1234-5678</p>
          </Col>
        </Row>
        <hr />
        <div className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} Mini ERP. Todos os direitos reservados.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;