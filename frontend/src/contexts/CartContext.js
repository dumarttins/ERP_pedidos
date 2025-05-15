import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../api/services';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  coupon_code: null,
  coupon_id: null
};

// Gera um ID de carrinho único
const generateCartId = () => {
  return 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// Obtém ou cria um ID de carrinho
const getCartId = () => {
  let cartId = localStorage.getItem('cart_id');
  if (!cartId) {
    cartId = generateCartId();
    localStorage.setItem('cart_id', cartId);
  }
  return cartId;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartId] = useState(getCartId());
  
  // Usa o mesmo cartId para todas as requisições
  useEffect(() => {
    // Define o cartId no axios através de um interceptor
    const requestInterceptor = cartService.configureCartId(cartId);
    
    return () => {
      // Remove o interceptor quando o componente for desmontado
      cartService.removeInterceptor(requestInterceptor);
    };
  }, [cartId]);
  
  // Carregar carrinho ao iniciar a aplicação
  useEffect(() => {
    const loadCart = async () => {
      // Tenta primeiro carregar carrinho do localStorage (como backup)
      const savedCart = localStorage.getItem('cart_backup');
      
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (err) {
          console.error('Erro ao ler carrinho local:', err);
        }
      }
      
      // Depois busca o carrinho atualizado do servidor
      await fetchCart();
    };
    
    loadCart();
  }, []);
  
  // Atualizar o localStorage sempre que o carrinho mudar
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      localStorage.setItem('cart_backup', JSON.stringify(cart));
    }
  }, [cart]);

  // Buscar o carrinho atual
  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      if (response.data.success) {
        const newCart = response.data.data;
        
        // Só atualiza o carrinho se houver itens ou se o carrinho atual estiver vazio
        if (newCart.items && newCart.items.length > 0) {
          setCart(newCart);
        } else if (cart.items.length === 0) {
          setCart(newCart);
        }
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
    
    // Guarda uma cópia do carrinho atual para restaurar em caso de erro
    const currentCart = { ...cart };
    
    try {
      // Atualiza o carrinho localmente para feedback imediato
      const updatedCart = { ...cart };
      if (updatedCart.items[itemIndex]) {
        updatedCart.items[itemIndex].quantity = quantity;
        setCart(updatedCart);
      }
      
      // Envia a atualização para o servidor
      const response = await cartService.updateItem({
        item_index: itemIndex,
        quantity
      });
      
      if (response.data.success) {
        // Se o servidor retorna dados novos, atualiza o carrinho
        if (response.data.data.items && response.data.data.items.length > 0) {
          setCart(response.data.data);
        }
        return true;
      }
      
      // Se não for bem sucedido, restaura o carrinho original
      setCart(currentCart);
      return false;
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar item');
      // Restaura o carrinho original em caso de erro
      setCart(currentCart);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover item do carrinho
  const removeItem = async (itemIndex) => {
    setLoading(true);
    setError(null);
    
    // Guarda uma cópia do carrinho atual para restaurar em caso de erro
    const currentCart = { ...cart };
    
    try {
      // Atualiza o carrinho localmente para feedback imediato
      const updatedCart = { ...cart };
      if (updatedCart.items.length > itemIndex) {
        updatedCart.items = updatedCart.items.filter((_, i) => i !== itemIndex);
        setCart(updatedCart);
      }
      
      const response = await cartService.removeItem(itemIndex);
      
      if (response.data.success) {
        // Se o servidor retorna dados novos, atualiza o carrinho
        setCart(response.data.data);
        return true;
      }
      
      // Se não for bem sucedido, restaura o carrinho original
      setCart(currentCart);
      return false;
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError(err.response?.data?.message || 'Erro ao remover item');
      // Restaura o carrinho original em caso de erro
      setCart(currentCart);
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