<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Stock;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;

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
        return response()->json([
            'success' => true,
            'data' => $this->getCart()
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
        
        // Adiciona ao carrinho
        $cart = $this->getCart();
        $price = $variation ? $product->price + $variation->price_adjustment : $product->price;
        
        // Verifica se já existe o mesmo item no carrinho
        $itemIndex = $this->findCartItemIndex($cart, $productId, $variationId);
        
        if ($itemIndex !== false) {
            // Se existir, soma a quantidade
            $newQuantity = $cart['items'][$itemIndex]['quantity'] + $quantity;
            
            // Verificação adicional de estoque
            if ($stock->quantity < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estoque insuficiente para a quantidade solicitada.'
                ], 400);
            }
            
            $cart['items'][$itemIndex]['quantity'] = $newQuantity;
        } else {
            // Se não existir, adiciona novo item
            $cart['items'][] = [
                'product_id' => $productId,
                'product_variation_id' => $variationId,
                'quantity' => $quantity,
                'price' => $price,
                'name' => $product->name,
                'variation_name' => $variation ? $variation->name : null
            ];
        }
        
        // Recalcula os totais
        $this->recalculateCart($cart);
        
        // Salva o carrinho na sessão
        $this->saveCart($cart);
        
        return response()->json([
            'success' => true,
            'message' => 'Produto adicionado ao carrinho!',
            'data' => $cart
        ]);
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
        
        $cart = $this->getCart();
        
        // Verifica se o item existe no carrinho
        if (!isset($cart['items'][$itemIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'Item não encontrado no carrinho.'
            ], 404);
        }
        
        $item = $cart['items'][$itemIndex];
        
        // Verifica estoque
        if ($item['product_variation_id']) {
            $stock = Stock::where('product_id', $item['product_id'])
                ->where('product_variation_id', $item['product_variation_id'])
                ->first();
        } else {
            $stock = Stock::where('product_id', $item['product_id'])
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
        $cart['items'][$itemIndex]['quantity'] = $quantity;
        
        // Recalcula os totais
        $this->recalculateCart($cart);
        
        // Salva o carrinho na sessão
        $this->saveCart($cart);
        
        return response()->json([
            'success' => true,
            'message' => 'Carrinho atualizado!',
            'data' => $cart
        ]);
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
        
        // Verifica se o item existe no carrinho
        if (!isset($cart['items'][$itemIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'Item não encontrado no carrinho.'
            ], 404);
        }
        
        // Remove o item
        array_splice($cart['items'], $itemIndex, 1);
        
        // Recalcula os totais
        $this->recalculateCart($cart);
        
        // Salva o carrinho na sessão
        $this->saveCart($cart);
        
        return response()->json([
            'success' => true,
            'message' => 'Item removido do carrinho!',
            'data' => $cart
        ]);
    }

    /**
     * Limpa o carrinho
     */
    public function clear()
    {
        $this->saveCart($this->emptyCart());
        
        return response()->json([
            'success' => true,
            'message' => 'Carrinho limpo!',
            'data' => $this->emptyCart()
        ]);
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
        if (!$coupon->isValid($cart['subtotal'])) {
            $message = 'Cupom inválido para este pedido.';
            
            if ($coupon->min_value && $cart['subtotal'] < $coupon->min_value) {
                $message = 'Valor mínimo do pedido não atingido. Adicione mais produtos.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $message
            ], 400);
        }
        
        // Aplica o cupom
        $cart['coupon_code'] = $couponCode;
        $cart['coupon_id'] = $coupon->id;
        
        // Calcula o desconto
        $cart['discount'] = $coupon->calculateDiscount($cart['subtotal']);
        
        // Recalcula os totais
        $this->recalculateCart($cart);
        
        // Salva o carrinho na sessão
        $this->saveCart($cart);
        
        return response()->json([
            'success' => true,
            'message' => 'Cupom aplicado com sucesso!',
            'data' => $cart
        ]);
    }

    /**
     * Remove um cupom do carrinho
     */
    public function removeCoupon()
    {
        $cart = $this->getCart();
        
        // Remove o cupom
        $cart['coupon_code'] = null;
        $cart['coupon_id'] = null;
        $cart['discount'] = 0;
        
        // Recalcula os totais
        $this->recalculateCart($cart);
        
        // Salva o carrinho na sessão
        $this->saveCart($cart);
        
        return response()->json([
            'success' => true,
            'message' => 'Cupom removido!',
            'data' => $cart
        ]);
    }

    /**
     * Método auxiliar para buscar o carrinho da sessão
     */
    private function getCart()
    {
        return Session::get('cart', $this->emptyCart());
    }

    /**
     * Método auxiliar para salvar o carrinho na sessão
     */
    private function saveCart($cart)
    {
        Session::put('cart', $cart);
    }

    /**
     * Método auxiliar para criar um carrinho vazio
     */
    private function emptyCart()
    {
        return [
            'items' => [],
            'subtotal' => 0,
            'discount' => 0,
            'shipping' => 0,
            'total' => 0,
            'coupon_code' => null,
            'coupon_id' => null
        ];
    }

    /**
     * Método auxiliar para encontrar um item no carrinho
     */
    private function findCartItemIndex($cart, $productId, $variationId)
    {
        foreach ($cart['items'] as $index => $item) {
            if ($item['product_id'] == $productId && $item['product_variation_id'] == $variationId) {
                return $index;
            }
        }
        
        return false;
    }

    /**
     * Método auxiliar para recalcular os totais do carrinho
     */
    private function recalculateCart(&$cart)
    {
        // Calcula o subtotal
        $subtotal = 0;
        foreach ($cart['items'] as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $cart['subtotal'] = $subtotal;
        
        // Se houver cupom, recalcula o desconto
        if ($cart['coupon_id']) {
            $coupon = Coupon::find($cart['coupon_id']);
            if ($coupon && $coupon->isValid($subtotal)) {
                $cart['discount'] = $coupon->calculateDiscount($subtotal);
            } else {
                // Se o cupom não for mais válido, remove-o
                $cart['coupon_code'] = null;
                $cart['coupon_id'] = null;
                $cart['discount'] = 0;
            }
        }
        
        // Calcula o frete
        $cart['shipping'] = $this->calculateShipping($subtotal);
        
        // Calcula o total
        $cart['total'] = $subtotal - $cart['discount'] + $cart['shipping'];
    }

    /**
     * Método auxiliar para calcular o frete
     */
    private function calculateShipping($subtotal)
    {
        if ($subtotal >= 200.00) {
            return 0; // Frete grátis
        } elseif ($subtotal >= 52.00 && $subtotal <= 166.59) {
            return 15.00;
        } else {
            return 20.00;
        }
    }
}