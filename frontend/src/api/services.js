import api from './config';

// Serviços para autenticação
export const authService = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  logout: () => api.post('/logout'),
  getCurrentUser: () => api.get('/user')
};

// Serviços para produtos
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`)
};

// Serviços para carrinho
export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (item) => api.post('/cart/add', item),
  updateItem: (data) => api.post('/cart/update', data),
  removeItem: (itemIndex) => api.post('/cart/remove', { item_index: itemIndex }),
  clearCart: () => api.get('/cart/clear'),
  applyCoupon: (couponCode) => api.post('/cart/apply-coupon', { coupon_code: couponCode }),
  removeCoupon: () => api.get('/cart/remove-coupon'),
  testSession: () => api.get('/cart/test-session'),
  testCart: () => api.get('/cart/test-cart'),
  
  // Configurar o cartId para todas as requisições
  configureCartId: (cartId) => {
    // Adiciona um interceptor para incluir o cartId em todas as requisições
    const interceptor = api.interceptors.request.use(
      config => {
        // Adiciona o cartId como parâmetro de query
        if (!config.params) {
          config.params = {};
        }
        config.params.cart_id = cartId;
        return config;
      },
      error => Promise.reject(error)
    );
    return interceptor;
  },
  
  // Remove o interceptor quando necessário
  removeInterceptor: (interceptor) => {
    api.interceptors.request.eject(interceptor);
  }
};

// Serviços para cupons (admin)
export const couponService = {
  getAll: () => api.get('/admin/coupons'),
  getById: (id) => api.get(`/admin/coupons/${id}`),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  delete: (id) => api.delete(`/admin/coupons/${id}`)
};

// Serviços para checkout
export const checkoutService = {
  fetchAddress: (zipcode) => api.post('/checkout/fetch-address', { zipcode }),
  processOrder: (orderData) => api.post('/checkout/process', orderData),
  getOrderDetails: (orderId) => api.get(`/checkout/success/${orderId}`)
};

// Serviços para administradores
export const adminService = {
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  markOrderAsPaid: (id) => api.put(`/admin/orders/${id}/pay`),
  markOrderAsDelivered: (id) => api.put(`/admin/orders/${id}/deliver`)
};