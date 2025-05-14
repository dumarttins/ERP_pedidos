import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../api/services';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    coupon_code: null,
    coupon_id: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar carrinho ao iniciar a aplicação
  useEffect(() => {
    fetchCart();
  }, []);

  // Buscar o carrinho atual
  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar carrinho:', err);
      setError('Não foi possível carregar o carrinho');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar item ao carrinho
  const addItem = async (productId, quantity = 1, variationId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.addItem({
        product_id: productId,
        product_variation_id: variationId,
        quantity
      });
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      setError(err.response?.data?.message || 'Erro ao adicionar item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar quantidade de um item
  const updateItemQuantity = async (itemIndex, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.updateItem({
        item_index: itemIndex,
        quantity
      });
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover item do carrinho
  const removeItem = async (itemIndex) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.removeItem(itemIndex);
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError(err.response?.data?.message || 'Erro ao remover item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Limpar o carrinho
  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.clearCart();
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
      setError(err.response?.data?.message || 'Erro ao limpar carrinho');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Aplicar cupom de desconto
  const applyCoupon = async (couponCode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.applyCoupon(couponCode);
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      setError(err.response?.data?.message || 'Erro ao aplicar cupom');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover cupom
  const removeCoupon = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.removeCoupon();
      
      if (response.data.success) {
        setCart(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao remover cupom:', err);
      setError(err.response?.data?.message || 'Erro ao remover cupom');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Retornar o número de itens no carrinho
  const getItemCount = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    getItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);