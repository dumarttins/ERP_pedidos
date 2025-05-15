<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Stock;
use App\Models\Coupon;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Estrutura do carrinho:
     * [
     *   'items' => [
     *     [
     *       'product_id' => 1,
     *       'product_variation_id' => null, // ou ID da variação
     *       'quantity' => 2,
     *       'price' => 99.90,
     *       'name' => 'Nome do Produto',
     *       'variation_name' => null // ou nome da variação
     *     ]
     *   ],
     *   'subtotal' => 199.80,
     *   'discount' => 0,
     *   'shipping' => 15.00,
     *   'total' => 214.80,
     *   'coupon_code' => null,
     *   'coupon_id' => null
     * ]
     */

    /**
     * Retorna o carrinho atual
     */
    public function index()
    {
        $cart = $this->getCart();
        
        // Converte o modelo Cart para o formato esperado pelo frontend
        $response = [
            'items' => $cart->items->toArray(),
            'subtotal' => $cart->subtotal,
            'discount' => $cart->discount,
            'shipping' => $cart->shipping,
            'total' => $cart->total,
            'coupon_code' => $cart->coupon_code,
            'coupon_id' => $cart->coupon_id
        ];
        
        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    /**
     * Adiciona um item ao carrinho
     */
    public function add(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'product_variation_id' => 'nullable|exists:product_variations,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        $productId = $request->product_id;
        $variationId = $request->product_variation_id;
        $quantity = $request->quantity;

        // Busca o produto
        $product = Product::findOrFail($productId);
        $variation = null;
        
        // Se houver uma variação, busca ela também
        if ($variationId) {
            $variation = ProductVariation::findOrFail($variationId);
            
            // Verifica se a variação pertence ao produto
            if ($variation->product_id != $productId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Variação de produto inválida.'
                ], 400);
            }
        }
        
        // Verifica estoque
        if ($variation) {
            $stock = Stock::where('product_id', $productId)
                ->where('product_variation_id', $variationId)
                ->first();
        } else {
            $stock = Stock::where('product_id', $productId)
                ->whereNull('product_variation_id')
                ->first();
        }
        
        if (!$stock || $stock->quantity < $quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Estoque insuficiente.'
            ], 400);
        }
        
        // Obtém o carrinho
        $cart = $this->getCart();
        $price = $variation ? $product->price + $variation->price_adjustment : $product->price;
        
        // Verifica se já existe o mesmo item no carrinho
        $cartItem = $cart->items()
            ->where('product_id', $productId)
            ->where('product_variation_id', $variationId)
            ->first();
        
        if ($cartItem) {
            // Se existir, soma a quantidade
            $newQuantity = $cartItem->quantity + $quantity;
            
            // Verificação adicional de estoque
            if ($stock->quantity < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estoque insuficiente para a quantidade solicitada.'
                ], 400);
            }
            
            $cartItem->quantity = $newQuantity;
            $cartItem->save();
        } else {
            // Se não existir, adiciona novo item
            $cartItem = new CartItem([
                'product_id' => $productId,
                'product_variation_id' => $variationId,
                'quantity' => $quantity,
                'price' => $price,
                'name' => $product->name,
                'variation_name' => $variation ? $variation->name : null
            ]);
            $cart->items()->save($cartItem);
        }
        
        // Recalcula os totais
        $cart->recalculate()->save();
        
        // Retorna o carrinho atualizado
        return $this->index();
    }

    /**
     * Atualiza a quantidade de um item no carrinho
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_index' => 'required|integer|min:0',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        $itemIndex = $request->item_index;
        $quantity = $request->quantity;
        
        // Obtém o carrinho
        $cart = $this->getCart();
        
        // Log de debug para o carrinho
        Log::info('Update - Cart before: ', [
            'cart_id' => $request->query('cart_id', 'n/a'),
            'item_index' => $itemIndex,
            'items_count' => $cart->items->count()
        ]);
        
        // Verifica se o carrinho tem itens
        if ($cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Carrinho vazio. Não há itens para atualizar.',
                'debug_info' => [
                    'cart_id' => $request->query('cart_id', 'n/a'),
                    'cart_token' => $request->cookie('cart_token', 'n/a'),
                    'session_id' => Session::getId()
                ]
            ], 400);
        }
        
        // Tenta encontrar o item pelo índice
        $cartItems = $cart->items->values();
        
        if (!isset($cartItems[$itemIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'Item não encontrado no carrinho. Tente recarregar a página.',
                'debug_info' => [
                    'cart_id' => $request->query('cart_id', 'n/a'),
                    'item_index' => $itemIndex,
                    'available_indexes' => range(0, $cartItems->count() - 1),
                    'items_count' => $cartItems->count()
                ]
            ], 404);
        }
        
        $cartItem = $cartItems[$itemIndex];
        
        // Verifica estoque
        if ($cartItem->product_variation_id) {
            $stock = Stock::where('product_id', $cartItem->product_id)
                ->where('product_variation_id', $cartItem->product_variation_id)
                ->first();
        } else {
            $stock = Stock::where('product_id', $cartItem->product_id)
                ->whereNull('product_variation_id')
                ->first();
        }
        
        if (!$stock || $stock->quantity < $quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Estoque insuficiente.'
            ], 400);
        }
        
        // Atualiza a quantidade
        $cartItem->quantity = $quantity;
        $cartItem->save();
        
        // Recalcula os totais
        $cart->recalculate()->save();
        
        // Retorna o carrinho atualizado
        return $this->index();
    }

    /**
     * Remove um item do carrinho
     */
    public function remove(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_index' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        $itemIndex = $request->item_index;
        $cart = $this->getCart();
        
        // Verifica se o carrinho tem itens
        if ($cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Carrinho vazio. Não há itens para remover.'
            ], 404);
        }
        
        // Tenta encontrar o item pelo índice
        $cartItems = $cart->items->values();
        
        if (!isset($cartItems[$itemIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'Item não encontrado no carrinho. Tente recarregar a página.'
            ], 404);
        }
        
        $cartItem = $cartItems[$itemIndex];
        
        // Remove o item
        $cartItem->delete();
        
        // Recalcula os totais
        $cart->recalculate()->save();
        
        // Retorna o carrinho atualizado
        return $this->index();
    }

    /**
     * Limpa o carrinho
     */
    public function clear()
    {
        $cart = $this->getCart();
        
        // Remove todos os itens
        $cart->items()->delete();
        
        // Reseta os valores
        $cart->subtotal = 0;
        $cart->discount = 0;
        $cart->shipping = 0;
        $cart->total = 0;
        $cart->coupon_code = null;
        $cart->coupon_id = null;
        $cart->save();
        
        // Retorna o carrinho vazio
        return $this->index();
    }

    /**
     * Aplica um cupom ao carrinho
     */
    public function applyCoupon(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'coupon_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        $couponCode = $request->coupon_code;
        $cart = $this->getCart();
        
        // Busca o cupom
        $coupon = Coupon::where('code', $couponCode)
            ->where('active', true)
            ->first();
        
        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Cupom inválido ou expirado.'
            ], 400);
        }
        
        // Verifica se o cupom é válido para o valor do carrinho
        if (!$coupon->isValid($cart->subtotal)) {
            $message = 'Cupom inválido para este pedido.';
            
            if ($coupon->min_value && $cart->subtotal < $coupon->min_value) {
                $message = 'Valor mínimo do pedido não atingido. Adicione mais produtos.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $message
            ], 400);
        }
        
        // Aplica o cupom
        $cart->coupon_code = $couponCode;
        $cart->coupon_id = $coupon->id;
        
        // Recalcula os totais (incluindo o desconto)
        $cart->recalculate()->save();
        
        // Retorna o carrinho atualizado
        return $this->index();
    }

    /**
     * Remove um cupom do carrinho
     */
    public function removeCoupon()
    {
        $cart = $this->getCart();
        
        // Remove o cupom
        $cart->coupon_code = null;
        $cart->coupon_id = null;
        
        // Recalcula os totais
        $cart->recalculate()->save();
        
        // Retorna o carrinho atualizado
        return $this->index();
    }

    /**
     * Método auxiliar para buscar ou criar o carrinho
     */
    private function getCart()
    {
        // Busca o cartId do parâmetro da requisição (enviado pelo frontend)
        $cartIdParam = request()->query('cart_id');
        
        // Se o cartId existir, tenta buscar o carrinho do banco de dados
        if ($cartIdParam) {
            $cart = Cart::where('cart_id', $cartIdParam)->first();
            
            // Se encontrou o carrinho, retorna ele
            if ($cart) {
                Log::info("Cart found with ID: {$cartIdParam}", ['items_count' => $cart->items->count()]);
                return $cart;
            }
        }
        
        // Se não encontrou o carrinho ou não tem cartId, cria um novo
        $cartIdParam = $cartIdParam ?: $this->generateCartToken();
        Log::info("Creating new cart with ID: {$cartIdParam}");
        
        $cart = Cart::create([
            'cart_id' => $cartIdParam,
            'user_id' => null, // Usuário anônimo
            'subtotal' => 0,
            'discount' => 0,
            'shipping' => 0,
            'total' => 0
        ]);
        
        return $cart;
    }

    /**
     * Gera um token único para o carrinho
     */
    private function generateCartToken()
    {
        return 'cart_' . uniqid(rand(), true);
    }

    /**
     * Método auxiliar para testar o carrinho, para fins de debug
     */
    public function testCart(Request $request)
    {
        $cartId = $request->query('cart_id', 'não informado');
        
        // Tenta buscar o carrinho
        if ($cartId !== 'não informado') {
            $cart = Cart::where('cart_id', $cartId)->first();
        } else {
            $cart = null;
        }
        
        return response()->json([
            'success' => true,
            'cart_id_param' => $cartId,
            'cart_exists' => $cart ? true : false,
            'cart_data' => $cart ? [
                'id' => $cart->id,
                'items_count' => $cart->items->count(),
                'subtotal' => $cart->subtotal,
                'total' => $cart->total
            ] : null
        ]);
    }
}