<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\CartController;
use App\Http\Controllers\API\CheckoutController;
use App\Http\Controllers\API\CouponController;
use App\Http\Controllers\API\WebhookController;
use Illuminate\Support\Facades\Session;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Rota para autenticação
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rotas públicas
Route::prefix('products')->group(function() {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{product}', [ProductController::class, 'show']);
});

// Consulta de CEP para checkout
Route::post('/checkout/fetch-address', [CheckoutController::class, 'fetchAddress']);

// Rotas para carrinho (baseadas em sessão/cookie)
Route::prefix('cart')->group(function() {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/add', [CartController::class, 'add']);
    Route::put('/update', [CartController::class, 'update']);
    Route::post('/update', [CartController::class, 'update']);
    Route::post('/remove', [CartController::class, 'remove']);
    Route::get('/clear', [CartController::class, 'clear']);
    Route::post('/apply-coupon', [CartController::class, 'applyCoupon']);
    Route::get('/remove-coupon', [CartController::class, 'removeCoupon']);
    
    // Rota de teste para verificar a sessão
    Route::get('/test-cart', [CartController::class, 'testCart']);
    
    Route::get('/test-session', function(Request $request) {
        $cartId = $request->query('cart_id', 'não informado');
        $cookieToken = $request->cookie('cart_token', 'não disponível');
        $cartKey = 'cart_' . ($cartId !== 'não informado' ? $cartId : $cookieToken);
        $cart = Session::get($cartKey, []);
        
        return response()->json([
            'success' => true,
            'cart_id_param' => $cartId,
            'cart_token_cookie' => $cookieToken,
            'session_id' => Session::getId(),
            'cart_key' => $cartKey,
            'cart_exists' => Session::has($cartKey),
            'cart_items_count' => count($cart['items'] ?? [])
        ]);
    });
});

// Checkout (processo de finalização da compra)
Route::prefix('checkout')->group(function() {
    Route::post('/process', [CheckoutController::class, 'process']);
    Route::get('/success/{order}', [CheckoutController::class, 'getOrderDetails']);
});

// Webhook público para receber atualizações de status de pedidos
Route::post('/webhook/order-status', [WebhookController::class, 'handleOrderStatus']);

// Rotas protegidas por autenticação
Route::middleware('auth:sanctum')->group(function () {
    // Informações do usuário autenticado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Gerenciamento de produtos (CRUD)
    Route::prefix('admin/products')->group(function() {
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
    });
    
    // Gerenciamento de cupons (CRUD)
    Route::prefix('admin/coupons')->group(function() {
        Route::get('/', [CouponController::class, 'index']);
        Route::post('/', [CouponController::class, 'store']);
        Route::get('/{coupon}', [CouponController::class, 'show']);
        Route::put('/{coupon}', [CouponController::class, 'update']);
        Route::delete('/{coupon}', [CouponController::class, 'destroy']);
    });
    
    // Lista de pedidos (admin)
    Route::get('/admin/orders', [CheckoutController::class, 'listOrders']);
    Route::get('/admin/orders/{order}', [CheckoutController::class, 'showOrder']);
    Route::put('/admin/orders/{order}/status', [CheckoutController::class, 'updateOrderStatus']);
    Route::put('/admin/orders/{order}/pay', [CheckoutController::class, 'markOrderAsPaid']);
    Route::put('/admin/orders/{order}/deliver', [CheckoutController::class, 'markOrderAsDelivered']);
});