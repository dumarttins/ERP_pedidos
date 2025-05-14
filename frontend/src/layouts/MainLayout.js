import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Container } from 'reactstrap';

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 py-5 mt-4">
        <Container>
          {children}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;