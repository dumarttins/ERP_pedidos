import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  NavbarToggler,
  Collapse,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge
} from 'reactstrap';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, getItemCount } = useCart();
  const navigate = useNavigate();

  const toggle = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar color="dark" dark expand="md" fixed="top" className="px-3">
      <NavbarBrand tag={Link} to="/">Mini ERP</NavbarBrand>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="me-auto" navbar>
          <NavItem>
            <NavLink tag={Link} to="/">Produtos</NavLink>
          </NavItem>
          {isAdmin() && (
            <>
              <NavItem>
                <NavLink tag={Link} to="/admin/products">Gerenciar Produtos</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/admin/coupons">Gerenciar Cupons</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/admin/orders">Gerenciar Pedidos</NavLink>
              </NavItem>
            </>
          )}
        </Nav>
        <Nav navbar>
          <NavItem>
            <NavLink tag={Link} to="/cart">
              <i className="fas fa-shopping-cart"></i> Carrinho
              {getItemCount() > 0 && (
                <Badge color="primary" pill className="ms-1">
                  {getItemCount()}
                </Badge>
              )}
            </NavLink>
          </NavItem>
          {isAuthenticated() ? (
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                <i className="fas fa-user"></i> {user?.name}
              </DropdownToggle>
              <DropdownMenu end>
                <DropdownItem tag={Link} to="/profile">
                  Perfil
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={handleLogout}>
                  Sair
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          ) : (
            <NavItem>
              <NavLink tag={Link} to="/login">
                <i className="fas fa-sign-in-alt"></i> Login
              </NavLink>
            </NavItem>
          )}
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default Header;